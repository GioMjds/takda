import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ERROR_CODES } from '@takda/shared';
import { QueueService } from '../queue.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('QueueService', () => {
  let service: QueueService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      booking: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<QueueService>(QueueService);
  });

  describe('computePositionForBooking', () => {
    it('throws NotFoundException when booking does not exist', async () => {
      prisma.booking.findUnique.mockResolvedValue(null);

      await expect(service.computePositionForBooking('b_invalid')).rejects.toThrow(
        NotFoundException,
      );

      try {
        await service.computePositionForBooking('b_invalid');
      } catch (err: any) {
        expect(err.getResponse()).toEqual({
          code: ERROR_CODES.BOOKING_NOT_FOUND,
          message: "Booking 'b_invalid' not found",
        });
      }
    });

    it('computes position for existing booking', async () => {
      const mockBooking = {
        id: 'b_2',
        businessId: 'biz_1',
        slotStart: new Date('2026-07-20T09:00:00.000Z'),
        createdAt: new Date('2026-07-20T08:05:00.000Z'),
        status: 'PENDING',
        service: { id: 'srv_1', durationMin: 15 },
        business: { id: 'biz_1', slug: 'barbershop' },
      };

      const dayBookings = [
        {
          id: 'b_1',
          slotStart: new Date('2026-07-20T08:30:00.000Z'),
          createdAt: new Date('2026-07-20T08:00:00.000Z'),
          status: 'CONFIRMED',
        },
        {
          id: 'b_2',
          slotStart: new Date('2026-07-20T09:00:00.000Z'),
          createdAt: new Date('2026-07-20T08:05:00.000Z'),
          status: 'PENDING',
        },
      ];

      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      prisma.booking.findMany.mockResolvedValue(dayBookings);

      const result = await service.computePositionForBooking('b_2');

      expect(result).toEqual({
        bookingId: 'b_2',
        position: 2,
        peopleAhead: 1,
        estimatedWaitMin: 15,
        slotStart: '2026-07-20T09:00:00.000Z',
      });
    });
  });

  describe('computeSnapshot', () => {
    it('computes snapshot active bookings count for business', async () => {
      const dayBookings = [
        {
          status: 'CONFIRMED',
          slotStart: new Date(),
        },
        {
          status: 'PENDING',
          slotStart: new Date(),
        },
        {
          status: 'CANCELLED',
          slotStart: new Date(),
        },
      ];

      prisma.booking.findMany.mockResolvedValue(dayBookings);

      const snapshot = await service.computeSnapshot('biz_1');

      expect(snapshot.businessId).toBe('biz_1');
      expect(snapshot.totalActive).toBe(2);
      expect(snapshot.lastUpdatedAt).toBeDefined();
    });
  });
});
