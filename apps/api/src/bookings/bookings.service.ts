import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ERROR_CODES } from '@takda/shared';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { QueueTokenService } from '../queue/queue-token.service';
import { TicketNumberService } from '../queue/ticket-number.service';
import { CreateBookingInput } from '@takda/shared';
import { BookingCreatedEvent } from './events/booking-created.event';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly queueTokenService: QueueTokenService,
    private readonly ticketNumberService: TicketNumberService,
  ) {}

  async createBooking(businessSlug: string, dto: CreateBookingInput) {
    const business = await this.prisma.business.findFirst({
      where: { slug: businessSlug, isActive: true },
    });
    if (!business) {
      throw new NotFoundException({
        code: ERROR_CODES.BUSINESS_NOT_FOUND,
        message: `Business '${businessSlug}' not found`,
      });
    }

    const service = await this.prisma.service.findUnique({
      where: { id: dto.serviceId },
    });
    if (!service || service.businessId !== business.id || !service.isActive) {
      throw new NotFoundException({
        code: ERROR_CODES.SERVICE_NOT_FOUND,
        message: `Service '${dto.serviceId}' not found`,
      });
    }

    const slotStartUtc = new Date(dto.slotStart);

    try {
      // Issue the ticket number and create the booking in one transaction so a
      // number is never burned without a booking (and vice versa).
      const booking = await this.prisma.$transaction(async (tx) => {
        const ticketNumber = await this.ticketNumberService.issue(
          tx,
          business.id,
          business.timezone,
          slotStartUtc,
        );

        return tx.booking.create({
          data: {
            tenantId: business.tenantId,
            businessId: business.id,
            serviceId: service.id,
            slotStart: slotStartUtc,
            ticketNumber,
            customerName: dto.customerName,
            customerPhone: dto.customerPhone,
            notes: dto.notes,
            status: 'PENDING',
            source: 'ONLINE',
            priorityTier: dto.priorityTier ?? 'STANDARD',
          },
        });
      });

      const { token, expiresAt } = this.queueTokenService.mintToken({
        bookingId: booking.id,
        businessId: business.id,
      });

      this.eventEmitter.emit(
        'booking.created',
        new BookingCreatedEvent(
          booking.id,
          business.id,
          service.id,
          booking.slotStart.toISOString(),
        ),
      );

      return {
        booking: {
          ...booking,
          slotStart: booking.slotStart.toISOString(),
          createdAt: booking.createdAt.toISOString(),
          updatedAt: booking.updatedAt.toISOString(),
          resolvedAt: booking.resolvedAt?.toISOString() ?? null,
        },
        queueToken: token,
        queueTokenExpiresAt: expiresAt,
      };
    } catch (err: any) {
      if (err.code === 'P2002') {
        throw new ConflictException({
          code: ERROR_CODES.SLOT_TAKEN,
          message: 'The selected slot has already been booked',
        });
      }
      throw err;
    }
  }
}
