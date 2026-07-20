import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { BookingsService } from '../bookings.service';
import { PrismaService } from '../../prisma/prisma.service';
import { QueueTokenService } from '../../queue/queue-token.service';

describe('BookingsService', () => {
  let service: BookingsService;
  let prisma: any;
  let eventEmitter: any;
  let tokenService: any;

  beforeEach(async () => {
    prisma = {
      business: { findFirst: jest.fn() },
      service: { findUnique: jest.fn() },
      booking: { create: jest.fn() },
    };
    eventEmitter = { emit: jest.fn() };
    tokenService = { mintToken: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventEmitter2, useValue: eventEmitter },
        { provide: QueueTokenService, useValue: tokenService },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
  });

  it('creates a booking, mints token, and emits BookingCreatedEvent', async () => {
    prisma.business.findFirst.mockResolvedValue({ id: 'biz_1', tenantId: 't_1', slug: 'test-biz' });
    prisma.service.findUnique.mockResolvedValue({ id: 'srv_1', businessId: 'biz_1', durationMin: 15, isActive: true });
    const mockBooking = {
      id: 'b_1',
      tenantId: 't_1',
      businessId: 'biz_1',
      serviceId: 'srv_1',
      slotStart: new Date('2026-07-20T09:00:00Z'),
      customerName: 'Juan Dela Cruz',
      customerPhone: '+639171234567',
      notes: null,
      status: 'PENDING',
      createdAt: new Date('2026-07-20T08:00:00Z'),
      updatedAt: new Date('2026-07-20T08:00:00Z'),
      resolvedAt: null,
    };
    prisma.booking.create.mockResolvedValue(mockBooking);
    tokenService.mintToken.mockReturnValue({
      token: 'jwt_token_123',
      expiresAt: '2026-07-21T09:00:00.000Z',
    });

    const result = await service.createBooking('test-biz', {
      serviceId: 'srv_1',
      slotStart: '2026-07-20T09:00:00.000Z',
      customerName: 'Juan Dela Cruz',
      customerPhone: '+639171234567',
    });

    expect(result.queueToken).toBe('jwt_token_123');
    expect(result.queueTokenExpiresAt).toBe('2026-07-21T09:00:00.000Z');
    expect(result.booking.id).toBe('b_1');
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'booking.created',
      expect.objectContaining({ bookingId: 'b_1', businessId: 'biz_1', serviceId: 'srv_1' }),
    );
  });

  it('throws NotFoundException when business is not found', async () => {
    prisma.business.findFirst.mockResolvedValue(null);

    await expect(
      service.createBooking('non-existent-biz', {
        serviceId: 'srv_1',
        slotStart: '2026-07-20T09:00:00.000Z',
        customerName: 'Juan Dela Cruz',
        customerPhone: '+639171234567',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException when service is not found or belongs to another business', async () => {
    prisma.business.findFirst.mockResolvedValue({ id: 'biz_1', tenantId: 't_1', slug: 'test-biz' });
    prisma.service.findUnique.mockResolvedValue(null);

    await expect(
      service.createBooking('test-biz', {
        serviceId: 'invalid_srv',
        slotStart: '2026-07-20T09:00:00.000Z',
        customerName: 'Juan Dela Cruz',
        customerPhone: '+639171234567',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws ConflictException when slot is already taken (P2002)', async () => {
    prisma.business.findFirst.mockResolvedValue({ id: 'biz_1', tenantId: 't_1', slug: 'test-biz' });
    prisma.service.findUnique.mockResolvedValue({ id: 'srv_1', businessId: 'biz_1', durationMin: 15, isActive: true });
    prisma.booking.create.mockRejectedValue({ code: 'P2002' });

    await expect(
      service.createBooking('test-biz', {
        serviceId: 'srv_1',
        slotStart: '2026-07-20T09:00:00.000Z',
        customerName: 'Juan Dela Cruz',
        customerPhone: '+639171234567',
      }),
    ).rejects.toThrow(ConflictException);
  });
});
