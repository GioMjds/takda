import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { businessDayBoundsUtc } from '@takda/shared';
import { PrismaService } from '../prisma/prisma.service';

/// A Prisma client or transaction client. Ticket issuance must run inside the
/// booking-creation transaction so the number and the booking commit together.
type PrismaClientLike = PrismaService | Prisma.TransactionClient;

@Injectable()
export class TicketNumberService {
  constructor(private readonly prisma: PrismaService) {}

  /// Atomically issues the next daily, per-business ticket number. Uses an
  /// upsert-then-increment on QueueCounter so concurrent bookings can't
  /// receive duplicate numbers: the unique (businessId, businessDate)
  /// constraint serializes the upsert, and the `increment` update is atomic.
  /// Numbers reset at the business-timezone day boundary.
  async issue(
    tx: PrismaClientLike,
    businessId: string,
    timezone: string,
    now: Date = new Date(),
  ): Promise<number> {
    const { dateStr } = businessDayBoundsUtc(now, timezone);
    // Anchor the date at UTC midnight of the local calendar date; the column
    // is a `date`, so only the calendar date is persisted.
    const businessDate = new Date(`${dateStr}T00:00:00.000Z`);

    const counter = await tx.queueCounter.upsert({
      where: {
        business_date_unique: { businessId, businessDate },
      },
      create: {
        businessId,
        businessDate,
        lastNumber: 1,
      },
      update: {
        lastNumber: { increment: 1 },
      },
      select: { lastNumber: true },
    });

    return counter.lastNumber;
  }
}
