import { Test, TestingModule } from '@nestjs/testing';
import { TicketNumberService } from '../ticket-number.service';
import { PrismaService } from '../../prisma/prisma.service';

const BIZ = 'biz_1';

describe('TicketNumberService', () => {
  let service: TicketNumberService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      queueCounter: {
        upsert: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketNumberService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(TicketNumberService);
  });

  it('issues 1 for the first ticket of the business day', async () => {
    prisma.queueCounter.upsert.mockResolvedValue({ lastNumber: 1 });

    const num = await service.issue(prisma, BIZ, 'Asia/Manila');

    expect(num).toBe(1);
    expect(prisma.queueCounter.upsert).toHaveBeenCalledTimes(1);
  });

  it('increments monotonically as tickets are issued', async () => {
    prisma.queueCounter.upsert
      .mockResolvedValueOnce({ lastNumber: 1 })
      .mockResolvedValueOnce({ lastNumber: 2 })
      .mockResolvedValueOnce({ lastNumber: 3 });

    const a = await service.issue(prisma, BIZ, 'Asia/Manila');
    const b = await service.issue(prisma, BIZ, 'Asia/Manila');
    const c = await service.issue(prisma, BIZ, 'Asia/Manila');

    expect([a, b, c]).toEqual([1, 2, 3]);
  });

  it('keys the counter by business and the local business date', async () => {
    prisma.queueCounter.upsert.mockResolvedValue({ lastNumber: 7 });

    // 2026-07-20T18:30Z is 2026-07-21 02:30 in Asia/Manila (UTC+8), so the
    // business date must roll to the 21st.
    await service.issue(
      prisma,
      BIZ,
      'Asia/Manila',
      new Date('2026-07-20T18:30:00.000Z'),
    );

    const arg = prisma.queueCounter.upsert.mock.calls[0][0];
    expect(arg.where.business_date_unique.businessId).toBe(BIZ);
    expect(
      (arg.where.business_date_unique.businessDate as Date).toISOString(),
    ).toBe('2026-07-21T00:00:00.000Z');
    expect(arg.create.lastNumber).toBe(1);
    expect(arg.update.lastNumber).toEqual({ increment: 1 });
  });
});
