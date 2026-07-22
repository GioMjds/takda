import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { businessDayBoundsUtc } from '@takda/shared';
import { PrismaService } from '../prisma/prisma.service';

type PrismaClientLike = PrismaService | Prisma.TransactionClient;

@Injectable()
export class TicketNumberService {
  constructor(private readonly prisma: PrismaService) {}

  async issue(
    tx: PrismaClientLike,
    businessId: string,
    timezone: string,
    now: Date = new Date(),
  ): Promise<number> {
    const { dateStr } = businessDayBoundsUtc(now, timezone);

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
