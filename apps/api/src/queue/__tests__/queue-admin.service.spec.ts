import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { QueueAdminService } from '../queue-admin.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { TicketNumberService } from '../ticket-number.service';

const BIZ = 'biz_1';
const USER = 'user_1';

const business = {
  id: BIZ,
  tenantId: 'tenant_1',
  timezone: 'Asia/Manila',
  name: 'Acme Clinic',
};

function makeBooking(overrides: Partial<any> = {}) {
  return {
    id: 'b_1',
    tenantId: 'tenant_1',
    businessId: BIZ,
    serviceId: 'svc_1',
    status: 'CONFIRMED',
    priorityTier: 'STANDARD',
    slotStart: new Date('2026-07-20T09:00:00.000Z'),
    createdAt: new Date('2026-07-20T08:00:00.000Z'),
    servingAt: null,
    completedAt: null,
    cancelledAt: null,
    ticketNumber: 5,
    recallCount: 0,
    customerName: 'Juan',
    customerPhone: '+639171234567',
    source: 'ONLINE',
    service: { name: 'Consult' },
    business,
    ...overrides,
  };
}

describe('QueueAdminService', () => {
  let service: QueueAdminService;
  let prisma: any;
  let events: any;
  let notifications: any;

  beforeEach(async () => {
    prisma = {
      business: { findUnique: jest.fn().mockResolvedValue(business) },
      membership: { findUnique: jest.fn().mockResolvedValue({ id: 'm_1' }) },
      booking: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      service: { findUnique: jest.fn(), findMany: jest.fn() },
      $transaction: jest.fn(async (cb: any) => cb(prisma)),
    };

    events = { emit: jest.fn() } as any;
    notifications = { sendSms: jest.fn().mockResolvedValue(undefined) } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueAdminService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventEmitter2, useValue: events },
        { provide: NotificationsService, useValue: notifications },
        { provide: TicketNumberService, useValue: { issue: jest.fn() } },
      ],
    }).compile();

    service = module.get(QueueAdminService);
  });

  describe('membership guard', () => {
    it('rejects callers without a membership for the business', async () => {
      prisma.membership.findUnique.mockResolvedValueOnce(null);
      await expect(service.callNext(BIZ, USER)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });

  describe('callNext', () => {
    it('promotes the next waiting booking to SERVING', async () => {
      prisma.booking.findFirst
        .mockResolvedValueOnce(null) // no one already serving
        .mockResolvedValueOnce(makeBooking()); // next in line
      prisma.booking.update.mockResolvedValue(
        makeBooking({ status: 'SERVING', servingAt: new Date() }),
      );

      const result = await service.callNext(BIZ, USER);

      expect(result?.status).toBe('SERVING');
      expect(prisma.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'SERVING' }),
        }),
      );
      expect(events.emit).toHaveBeenCalledWith(
        'queue.head.changed',
        expect.anything(),
      );
    });

    it('rejects when someone is already being served', async () => {
      prisma.booking.findFirst.mockResolvedValueOnce(
        makeBooking({ status: 'SERVING' }),
      );
      await expect(service.callNext(BIZ, USER)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('returns null on an empty queue', async () => {
      prisma.booking.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      await expect(service.callNext(BIZ, USER)).resolves.toBeNull();
    });
  });

  describe('recall', () => {
    it('increments recallCount only for a serving booking', async () => {
      prisma.booking.findUnique.mockResolvedValue(
        makeBooking({ status: 'SERVING' }),
      );
      prisma.booking.update.mockResolvedValue(
        makeBooking({ status: 'SERVING', recallCount: 1 }),
      );

      const result = await service.recall(BIZ, 'b_1', USER);
      expect(result.recallCount).toBe(1);
      expect(prisma.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { recallCount: { increment: 1 } },
        }),
      );
    });

    it('rejects recall on a non-serving booking', async () => {
      prisma.booking.findUnique.mockResolvedValue(
        makeBooking({ status: 'CONFIRMED' }),
      );
      await expect(service.recall(BIZ, 'b_1', USER)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('cancel', () => {
    it('refuses to cancel a serving booking', async () => {
      prisma.booking.findUnique.mockResolvedValue(
        makeBooking({ status: 'SERVING' }),
      );
      await expect(
        service.cancel(BIZ, 'b_1', USER, 'changed mind'),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('cancels a waiting booking and stamps cancelledBy OWNER', async () => {
      prisma.booking.findUnique.mockResolvedValue(makeBooking());
      prisma.booking.update.mockResolvedValue(
        makeBooking({ status: 'CANCELLED', cancelledBy: 'OWNER' }),
      );

      const result = await service.cancel(BIZ, 'b_1', USER, 'no reason');
      expect(result.status).toBe('CANCELLED');
      expect(prisma.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'CANCELLED',
            cancelledBy: 'OWNER',
          }),
        }),
      );
    });
  });

  describe('transfer', () => {
    it('rejects a target service from another business', async () => {
      prisma.booking.findUnique.mockResolvedValue(makeBooking());
      prisma.service.findUnique.mockResolvedValue({
        id: 'svc_x',
        businessId: 'other_biz',
      });
      await expect(
        service.transfer(BIZ, 'b_1', USER, 'svc_x'),
      ).rejects.toThrow();
    });
  });

  describe('getLiveQueue', () => {
    it('annotates waiting positions and identifies the serving head', async () => {
      prisma.booking.findMany.mockResolvedValue([
        makeBooking({ id: 'b_serve', status: 'SERVING' }),
        makeBooking({ id: 'b_wait', status: 'CONFIRMED' }),
        makeBooking({ id: 'b_done', status: 'COMPLETED' }),
      ]);

      const result = await service.getLiveQueue(BIZ, USER);

      expect(result.servingBookingId).toBe('b_serve');
      const byId = Object.fromEntries(
        result.entries.map((e) => [e.bookingId, e]),
      );
      expect(byId['b_serve'].position).toBe(1);
      expect(byId['b_wait'].position).toBe(2);
      expect(byId['b_done'].position).toBeNull();
    });
  });

  describe('listServices', () => {
    it('returns active services for the business after the membership check', async () => {
      prisma.service.findMany.mockResolvedValue([
        { id: 's_1', name: 'Haircut', slug: 'haircut', durationMin: 30 },
      ]);

      const result = await service.listServices(BIZ, USER);

      expect(prisma.membership.findUnique).toHaveBeenCalled();
      expect(prisma.service.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { businessId: BIZ, isActive: true },
        }),
      );
      expect(result).toEqual([
        { id: 's_1', name: 'Haircut', slug: 'haircut', durationMin: 30 },
      ]);
    });

    it('rejects callers without a membership', async () => {
      prisma.membership.findUnique.mockResolvedValueOnce(null);
      await expect(service.listServices(BIZ, USER)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });
});
