import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
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

    const slotDate = new Date(booking.slotStart);
    const startOfDay = new Date(slotDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(slotDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

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
      },
    });

    return computeQueuePosition({
      businessId: booking.businessId,
      bookingId: booking.id,
      slotStart: booking.slotStart.toISOString(),
      serviceDurationMin: booking.service.durationMin,
      bookings: dayBookings.map((b) => ({
        id: b.id,
        slotStart: b.slotStart.toISOString(),
        createdAt: b.createdAt.toISOString(),
        status: b.status,
      })),
      businessDayStartUtc: startOfDay.toISOString(),
      businessDayEndUtc: endOfDay.toISOString(),
    });
  }

  async computeSnapshot(businessId: string): Promise<QueueSnapshot> {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setUTCHours(23, 59, 59, 999);

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
