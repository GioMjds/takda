import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { ERROR_CODES } from '@takda/shared';
import { QueuePublicController } from '../queue-public.controller';
import { QueueTokenService } from '../queue-token.service';
import { QueueService } from '../queue.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('QueuePublicController', () => {
  let controller: QueuePublicController;
  let prisma: any;
  let queueTokenService: any;
  let queueService: any;

  beforeEach(async () => {
    prisma = {
      booking: {
        findUnique: jest.fn(),
      },
    };
    queueTokenService = {
      mintToken: jest.fn(),
    };
    queueService = {
      computePositionForBooking: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [QueuePublicController],
      providers: [
        { provide: PrismaService, useValue: prisma },
        { provide: QueueTokenService, useValue: queueTokenService },
        { provide: QueueService, useValue: queueService },
      ],
    }).compile();

    controller = module.get<QueuePublicController>(QueuePublicController);
  });

  describe('POST /v1/bookings/:id/queue-token (refreshQueueToken)', () => {
    it('refreshes token successfully for valid booking and phone', async () => {
      const mockBooking = {
        id: 'b_1',
        businessId: 'biz_1',
        customerPhone: '+639171234567',
        status: 'CONFIRMED',
        slotStart: new Date('2026-07-20T09:00:00.000Z'),
        createdAt: new Date('2026-07-20T08:00:00.000Z'),
        updatedAt: new Date('2026-07-20T08:00:00.000Z'),
        resolvedAt: null,
      };

      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      queueTokenService.mintToken.mockReturnValue({
        token: 'new_token_123',
        expiresAt: '2026-07-21T09:00:00.000Z',
      });

      const res = await controller.refreshQueueToken('b_1', {
        phone: '+639171234567',
      });

      expect(res.queueToken).toBe('new_token_123');
      expect(res.queueTokenExpiresAt).toBe('2026-07-21T09:00:00.000Z');
      expect(res.booking.id).toBe('b_1');
    });

    it('throws ConflictException with BOOKING_NOT_FOUND when booking not found or phone mismatch', async () => {
      prisma.booking.findUnique.mockResolvedValue(null);

      await expect(
        controller.refreshQueueToken('b_invalid', { phone: '+639171234567' }),
      ).rejects.toThrow(ConflictException);

      try {
        await controller.refreshQueueToken('b_invalid', { phone: '+639171234567' });
      } catch (err: any) {
        expect(err.getResponse()).toEqual({
          code: ERROR_CODES.BOOKING_NOT_FOUND,
          message: 'Booking not found or phone mismatch',
        });
      }
    });

    it('throws ConflictException with BOOKING_TERMINAL when booking is in terminal state', async () => {
      const mockBooking = {
        id: 'b_1',
        businessId: 'biz_1',
        customerPhone: '+639171234567',
        status: 'CANCELLED',
        slotStart: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        resolvedAt: null,
      };

      prisma.booking.findUnique.mockResolvedValue(mockBooking);

      await expect(
        controller.refreshQueueToken('b_1', { phone: '+639171234567' }),
      ).rejects.toThrow(ConflictException);

      try {
        await controller.refreshQueueToken('b_1', { phone: '+639171234567' });
      } catch (err: any) {
        expect(err.getResponse()).toEqual({
          code: ERROR_CODES.BOOKING_TERMINAL,
          message: "Booking is in terminal state 'CANCELLED'",
        });
      }
    });
  });
});
