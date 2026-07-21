import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma, Booking } from '@prisma/client';
import {
  canTransition,
  isTerminalStatus,
  businessDayBoundsUtc,
  ERROR_CODES,
  type BookingStatus,
  type PriorityTier,
  type WalkInInput,
  type SkipReason,
  type QueueHistoryQuery,
  type QueueHistoryResponse,
  type QueueHistoryEntry,
  type LiveQueueEntry,
  type LiveQueue,
} from '@takda/shared';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TicketNumberService } from './ticket-number.service';
import { BookingChangedEvent } from '../bookings/events/booking-changed.event';
import { BookingCreatedEvent } from '../bookings/events/booking-created.event';
import { QueueHeadChangedEvent } from '../bookings/events/queue-head-changed.event';
import { computeWaitStats, waitMinFor } from '../common/utils/queue';

/// Statuses that occupy a live slot — used to find the next callable booking
/// and to enforce single-serving invariants.
const WAITING_STATUSES: BookingStatus[] = [
  'PENDING',
  'CONFIRMED',
  'CHECKED_IN',
];

@Injectable()
export class QueueAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
    private readonly notifications: NotificationsService,
    private readonly ticketNumbers: TicketNumberService,
  ) {}

  /// Verifies the acting user belongs to the business (any membership role) and
  /// shares its tenant, then returns the business. Guards every owner action so
  /// a valid JWT for tenant A can't mutate tenant B's queue.
  private async assertBusinessAccess(businessId: string, userId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });
    if (!business) {
      throw new NotFoundException({
        code: ERROR_CODES.BUSINESS_NOT_FOUND,
        message: `Business '${businessId}' not found`,
      });
    }

    const membership = await this.prisma.membership.findUnique({
      where: { userId_businessId: { userId, businessId } },
      select: { id: true },
    });
    if (!membership) {
      throw new ForbiddenException({
        code: ERROR_CODES.FORBIDDEN,
        message: 'You do not have access to this business',
      });
    }

    return business;
  }

  private async getBookingForBusiness(bookingId: string, businessId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { service: true, business: true },
    });
    if (!booking || booking.businessId !== businessId) {
      throw new NotFoundException({
        code: ERROR_CODES.BOOKING_NOT_FOUND,
        message: `Booking '${bookingId}' not found`,
      });
    }
    return booking;
  }

  private assertTransition(from: BookingStatus, to: BookingStatus) {
    if (from === to) return;
    if (!canTransition(from, to)) {
      throw new ConflictException({
        code: ERROR_CODES.BOOKING_TERMINAL,
        message: `Cannot move booking from '${from}' to '${to}'`,
      });
    }
  }

  private emitChanged(booking: Booking) {
    this.events.emit(
      'booking.changed',
      new BookingChangedEvent(
        booking.id,
        booking.businessId,
        booking.status,
        booking.slotStart.toISOString(),
      ),
    );
  }

  private emitHeadChanged(booking: Booking | null, businessId: string) {
    this.events.emit(
      'queue.head.changed',
      new QueueHeadChangedEvent(
        businessId,
        booking?.id ?? null,
        booking?.ticketNumber ?? null,
        (booking?.status as BookingStatus) ?? null,
      ),
    );
  }

  private async notifyBooking(
    booking: Booking & {
      service?: { name: string };
      business?: { name: string };
    },
    templateId: Parameters<NotificationsService['sendSms']>[0]['templateId'],
    extraVars: Record<string, string | number> = {},
  ) {
    await this.notifications.sendSms({
      tenantId: booking.tenantId,
      businessId: booking.businessId,
      bookingId: booking.id,
      toPhone: booking.customerPhone,
      templateId,
      vars: {
        businessName: booking.business?.name ?? '',
        customerName: booking.customerName,
        ticketNumber: booking.ticketNumber ?? 0,
        ...extraVars,
      },
    });
  }

  // ---------------------------------------------------------------------------
  // #17 / #24 — Call next & complete
  // ---------------------------------------------------------------------------

  /// Calls the next waiting booking to the counter. Enforces one SERVING
  /// booking per business: if someone is already serving, the caller must
  /// complete/skip them first. Returns the newly-serving booking, or null when
  /// the queue is empty.
  async callNext(businessId: string, userId: string): Promise<Booking | null> {
    const business = await this.assertBusinessAccess(businessId, userId);
    const { startUtc, endUtc } = businessDayBoundsUtc(
      new Date(),
      business.timezone,
    );

    const result = await this.prisma.$transaction(async (tx) => {
      const alreadyServing = await tx.booking.findFirst({
        where: { businessId, status: 'SERVING' },
      });
      if (alreadyServing) {
        throw new ConflictException({
          code: ERROR_CODES.QUEUE_ALREADY_SERVING,
          message:
            'Complete or skip the current customer before calling the next',
        });
      }

      const next = await tx.booking.findFirst({
        where: {
          businessId,
          status: { in: WAITING_STATUSES },
          slotStart: { gte: startUtc, lte: endUtc },
        },
        // Priority tier ascending == VIP first (rank 0). Then slotStart, then
        // createdAt — mirrors the shared compareQueueOrder logic.
        orderBy: [
          { priorityTier: 'asc' },
          { slotStart: 'asc' },
          { createdAt: 'asc' },
        ],
        include: { service: true, business: true },
      });
      if (!next) return null;

      this.assertTransition(next.status, 'SERVING');

      return tx.booking.update({
        where: { id: next.id },
        data: { status: 'SERVING', servingAt: new Date() },
        include: { service: true, business: true },
      });
    });

    if (result) {
      this.emitChanged(result);
      this.emitHeadChanged(result, businessId);
      await this.notifyBooking(result, 'queue.now_serving');
    } else {
      this.emitHeadChanged(null, businessId);
    }
    return result;
  }

  /// Marks the currently-serving booking as completed (terminal). The dashboard
  /// calls `callNext` separately to advance to the next customer.
  async complete(
    businessId: string,
    bookingId: string,
    userId: string,
  ): Promise<Booking> {
    await this.assertBusinessAccess(businessId, userId);
    const booking = await this.getBookingForBusiness(bookingId, businessId);
    this.assertTransition(booking.status, 'COMPLETED');

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        resolvedAt: new Date(),
      },
    });

    this.emitChanged(updated);
    this.emitHeadChanged(null, businessId);
    return updated;
  }

  // ---------------------------------------------------------------------------
  // #19 — Recall (re-announce the serving customer)
  // ---------------------------------------------------------------------------

  async recall(
    businessId: string,
    bookingId: string,
    userId: string,
  ): Promise<Booking> {
    await this.assertBusinessAccess(businessId, userId);
    const booking = await this.getBookingForBusiness(bookingId, businessId);

    if (booking.status !== 'SERVING') {
      throw new ConflictException({
        code: ERROR_CODES.BOOKING_NOT_SERVING,
        message: 'Only a currently-serving booking can be recalled',
      });
    }

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { recallCount: { increment: 1 } },
      include: { service: true, business: true },
    });

    await this.notifyBooking(updated, 'queue.recall');
    return updated;
  }

  // ---------------------------------------------------------------------------
  // #20 — Skip (mark no-show)
  // ---------------------------------------------------------------------------

  async skip(
    businessId: string,
    bookingId: string,
    userId: string,
    reason: SkipReason,
  ): Promise<Booking> {
    await this.assertBusinessAccess(businessId, userId);
    const booking = await this.getBookingForBusiness(bookingId, businessId);
    this.assertTransition(booking.status, 'NO_SHOW');

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'NO_SHOW', resolvedAt: new Date() },
      include: { service: true, business: true },
    });

    this.emitChanged(updated);
    if (booking.status === 'SERVING') this.emitHeadChanged(null, businessId);
    if (reason !== 'wrong_queue') {
      await this.notifyBooking(updated, 'queue.skipped');
    }
    return updated;
  }

  // ---------------------------------------------------------------------------
  // #21 — Owner cancel-on-behalf
  // ---------------------------------------------------------------------------

  async cancel(
    businessId: string,
    bookingId: string,
    userId: string,
    reason?: string | null,
  ): Promise<Booking> {
    await this.assertBusinessAccess(businessId, userId);
    const booking = await this.getBookingForBusiness(bookingId, businessId);

    if (isTerminalStatus(booking.status)) {
      throw new ConflictException({
        code: ERROR_CODES.BOOKING_TERMINAL,
        message: `Booking is already '${booking.status}'`,
      });
    }
    // #21: a customer currently at the counter must be skipped or completed
    // first — cancelling out from under a serving booking loses the head.
    if (booking.status === 'SERVING') {
      throw new ConflictException({
        code: ERROR_CODES.BOOKING_NOT_SERVING,
        message: 'Skip or complete the serving customer before cancelling',
      });
    }
    this.assertTransition(booking.status, 'CANCELLED');

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledBy: 'OWNER',
        resolvedAt: new Date(),
      },
      include: { service: true, business: true },
    });

    this.emitChanged(updated);
    if (booking.status) this.emitHeadChanged(null, businessId);
    await this.notifyBooking(updated, 'queue.cancelled', {
      reason: reason ?? '',
    });
    return updated;
  }

  // ---------------------------------------------------------------------------
  // #18 — Set priority tier
  // ---------------------------------------------------------------------------

  async setPriority(
    businessId: string,
    bookingId: string,
    userId: string,
    priorityTier: PriorityTier,
  ): Promise<Booking> {
    await this.assertBusinessAccess(businessId, userId);
    const booking = await this.getBookingForBusiness(bookingId, businessId);

    if (isTerminalStatus(booking.status)) {
      throw new ConflictException({
        code: ERROR_CODES.BOOKING_TERMINAL,
        message: `Cannot re-prioritize a '${booking.status}' booking`,
      });
    }

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { priorityTier },
    });

    this.emitChanged(updated);
    return updated;
  }

  async transfer(
    businessId: string,
    bookingId: string,
    userId: string,
    targetServiceId: string,
    slotStart?: string,
  ): Promise<Booking> {
    await this.assertBusinessAccess(businessId, userId);
    const booking = await this.getBookingForBusiness(bookingId, businessId);

    if (isTerminalStatus(booking.status)) {
      throw new ConflictException({
        code: ERROR_CODES.BOOKING_TERMINAL,
        message: `Cannot transfer a '${booking.status}' booking`,
      });
    }

    const targetService = await this.prisma.service.findUnique({
      where: { id: targetServiceId },
    });
    if (!targetService || targetService.businessId !== businessId) {
      throw new NotFoundException({
        code: ERROR_CODES.SERVICE_NOT_FOUND,
        message: `Service '${targetServiceId}' not found in this business`,
      });
    }

    const newSlotStart = slotStart ? new Date(slotStart) : booking.slotStart;

    try {
      const updated = await this.prisma.booking.update({
        where: { id: bookingId },
        data: { serviceId: targetServiceId, slotStart: newSlotStart },
        include: { service: true, business: true },
      });

      this.emitChanged(updated);
      await this.notifyBooking(updated, 'queue.transferred', {
        serviceName: targetService.name,
      });
      return updated;
    } catch (err: any) {
      if (err.code === 'P2002') {
        throw new ConflictException({
          code: ERROR_CODES.SLOT_TAKEN,
          message: 'That slot is already taken in the target service',
        });
      }
      throw err;
    }
  }

  /// Registers a walk-in customer directly into today's queue. Issues a ticket
  /// number the same way the public flow does and starts the booking as
  /// CONFIRMED (the customer is physically present).
  async registerWalkIn(
    businessId: string,
    userId: string,
    input: WalkInInput,
  ): Promise<Booking> {
    const business = await this.assertBusinessAccess(businessId, userId);

    const service = await this.prisma.service.findUnique({
      where: { id: input.serviceId },
    });
    if (!service || service.businessId !== businessId) {
      throw new NotFoundException({
        code: ERROR_CODES.SERVICE_NOT_FOUND,
        message: `Service '${input.serviceId}' not found in this business`,
      });
    }

    const now = new Date();
    const booking = await this.prisma.$transaction(async (tx) => {
      const ticketNumber = await this.ticketNumbers.issue(
        tx,
        businessId,
        business.timezone,
        now,
      );
      return tx.booking.create({
        data: {
          tenantId: business.tenantId,
          businessId,
          serviceId: service.id,
          slotStart: now,
          ticketNumber,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          notes: input.notes ?? null,
          status: 'CONFIRMED',
          source: 'WALK_IN',
          priorityTier: input.priorityTier ?? 'STANDARD',
        },
        include: { service: true, business: true },
      });
    });

    this.events.emit(
      'booking.created',
      new BookingCreatedEvent(
        booking.id,
        booking.businessId,
        booking.serviceId,
        booking.slotStart.toISOString(),
      ),
    );
    return booking;
  }

  /// Paginated historical view of a business's queue, filterable by local day,
  /// service, and status. Returns entries plus aggregate wait-time stats.
  async getHistory(
    businessId: string,
    userId: string,
    query: QueueHistoryQuery,
  ): Promise<QueueHistoryResponse> {
    const business = await this.assertBusinessAccess(businessId, userId);

    const where: Prisma.BookingWhereInput = { businessId };

    if (query.date) {
      const anchor = new Date(`${query.date}T00:00:00.000Z`);
      const { startUtc, endUtc } = businessDayBoundsUtc(
        anchor,
        business.timezone,
      );
      where.slotStart = { gte: startUtc, lte: endUtc };
    }
    if (query.serviceId) where.serviceId = query.serviceId;
    if (query.status) where.status = query.status;

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const [rows, total, statsRows] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        include: { service: { select: { name: true } } },
        orderBy: [{ slotStart: 'asc' }, { createdAt: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.booking.count({ where }),
      this.prisma.booking.findMany({
        where,
        select: { status: true, slotStart: true, servingAt: true },
      }),
    ]);

    const entries: QueueHistoryEntry[] = rows.map((b) => ({
      bookingId: b.id,
      ticketNumber: b.ticketNumber,
      customerName: b.customerName,
      customerPhone: b.customerPhone,
      serviceId: b.serviceId,
      serviceName: b.service?.name,
      status: b.status,
      priorityTier: b.priorityTier,
      slotStart: b.slotStart.toISOString(),
      servingAt: b.servingAt?.toISOString() ?? null,
      completedAt: b.completedAt?.toISOString() ?? null,
      cancelledAt: b.cancelledAt?.toISOString() ?? null,
      waitMin: waitMinFor(b.slotStart, b.servingAt),
    }));

    const stats = computeWaitStats(statsRows);

    return { entries, stats, page, pageSize, total };
  }

  /// Today's queue for the owner dashboard: all of the current business day's
  /// bookings ordered by priority then slotStart, each annotated with its
  /// 1-based waiting position (null once terminal) and the serving head.
  async getLiveQueue(businessId: string, userId: string): Promise<LiveQueue> {
    const business = await this.assertBusinessAccess(businessId, userId);
    const { startUtc, endUtc } = businessDayBoundsUtc(
      new Date(),
      business.timezone,
    );

    const rows = await this.prisma.booking.findMany({
      where: { businessId, slotStart: { gte: startUtc, lte: endUtc } },
      include: { service: { select: { name: true } } },
      orderBy: [
        { priorityTier: 'asc' },
        { slotStart: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    let waiting = 0;
    let servingBookingId: string | null = null;
    const entries: LiveQueueEntry[] = rows.map((b) => {
      const isWaiting =
        b.status === 'PENDING' ||
        b.status === 'CONFIRMED' ||
        b.status === 'CHECKED_IN' ||
        b.status === 'SERVING';
      const position = isWaiting ? ++waiting : null;
      if (b.status === 'SERVING') servingBookingId = b.id;
      return {
        bookingId: b.id,
        ticketNumber: b.ticketNumber,
        customerName: b.customerName,
        customerPhone: b.customerPhone,
        serviceId: b.serviceId,
        serviceName: b.service?.name,
        status: b.status,
        priorityTier: b.priorityTier,
        source: b.source,
        slotStart: b.slotStart.toISOString(),
        position,
        recallCount: b.recallCount,
      };
    });

    return {
      businessId,
      entries,
      servingBookingId,
      lastUpdatedAt: new Date().toISOString(),
    };
  }

  /// Active services for the business, used by the dashboard's walk-in modal
  /// (#16) and transfer picker (#22). Membership-gated like every owner action.
  async listServices(
    businessId: string,
    userId: string,
  ): Promise<
    Array<{ id: string; name: string; slug: string; durationMin: number }>
  > {
    await this.assertBusinessAccess(businessId, userId);
    const services = await this.prisma.service.findMany({
      where: { businessId, isActive: true },
      select: { id: true, name: true, slug: true, durationMin: true },
      orderBy: { name: 'asc' },
    });
    return services;
  }
}
