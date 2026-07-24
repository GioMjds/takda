import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessesService } from '../businesses/businesses.service';
import { UpsertWorkingHoursInput } from '@takda/shared';

@Injectable()
export class WorkingHoursService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly businessesService: BusinessesService,
  ) {}

  async listForBusiness(businessId: string, userId: string) {
    await this.businessesService.findOne(businessId, userId);
    return this.prisma.workingHours.findMany({
      where: { businessId },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  async upsertMany(
    businessId: string,
    userId: string,
    dto: UpsertWorkingHoursInput,
  ) {
    await this.businessesService.findOne(businessId, userId);

    return this.prisma.$transaction(async (tx) => {
      const results = [];
      for (const row of dto.hours) {
        const item = await tx.workingHours.upsert({
          where: {
            businessId_dayOfWeek: {
              businessId,
              dayOfWeek: row.dayOfWeek,
            },
          },
          create: {
            businessId,
            dayOfWeek: row.dayOfWeek,
            openTime: row.openTime,
            closeTime: row.closeTime,
            isClosed: row.isClosed,
          },
          update: {
            openTime: row.openTime,
            closeTime: row.closeTime,
            isClosed: row.isClosed,
          },
        });
        results.push(item);
      }
      return results;
    });
  }
}
