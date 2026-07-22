import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  businessDayBoundsUtc,
  computeQueuePosition,
  countActiveForBusiness,
  ERROR_CODES,
  QueuePositionResult,
  QueueSnapshot,
} from '@takda/shared';

@Injectable()
export class QueueService {
  constructor(private readonly prisma: PrismaService) {}

  async computePositionForBooking(bookingId: string): Promise<QueuePositionResult> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { service: true, business: true },
    });

    if (!booking) {
      throw new NotFoundException({
        code: ERROR_CODES.BOOKING_NOT_FOUND,
        message: `Booking '${bookingId}' not found`,
      });
    }

    const { startUtc: startOfDay, endUtc: endOfDay } = businessDayBoundsUtc(
      new Date(booking.slotStart),
      booking.business.timezone,
    );

    const dayBookings = await this.prisma.booking.findMany({
      where: {
        businessId: booking.businessId,
        slotStart: { gte: startOfDay, lte: endOfDay },
      },
      select: {
        id: true,
        slotStart: true,
        createdAt: true,
        status: true,
        priorityTier: true,
      },
    });

    return computeQueuePosition({
      businessId: booking.businessId,
      bookingId: booking.id,
      slotStart: booking.slotStart.toISOString(),
      serviceDurationMin: booking.service.durationMin,
      ticketNumber: booking.ticketNumber,
      priorityTier: booking.priorityTier,
      bookings: dayBookings.map((b) => ({
        id: b.id,
        slotStart: b.slotStart.toISOString(),
        createdAt: b.createdAt.toISOString(),
        status: b.status,
        priorityTier: b.priorityTier,
      })),
      businessDayStartUtc: startOfDay.toISOString(),
      businessDayEndUtc: endOfDay.toISOString(),
    });
  }

  async computeSnapshot(businessId: string): Promise<QueueSnapshot> {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { timezone: true },
    });
    const timezone = business?.timezone ?? 'Asia/Manila';

    const { startUtc: startOfDay, endUtc: endOfDay } = businessDayBoundsUtc(
      new Date(),
      timezone,
    );

    const bookings = await this.prisma.booking.findMany({
      where: {
        businessId,
        slotStart: { gte: startOfDay, lte: endOfDay },
      },
      select: { status: true, slotStart: true },
    });

    const totalActive = countActiveForBusiness(
      bookings.map((b) => ({
        status: b.status,
        slotStart: b.slotStart.toISOString(),
      })),
      startOfDay.toISOString(),
      endOfDay.toISOString(),
    );

    return {
      businessId,
      totalActive,
      lastUpdatedAt: new Date().toISOString(),
    };
  }
}
