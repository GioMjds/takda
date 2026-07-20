import { Test, TestingModule } from '@nestjs/testing';
import { QueueGateway } from '../queue.gateway';
import { QueueTokenService } from '../queue-token.service';
import { QueueService } from '../queue.service';
import { BookingCreatedEvent } from '../../bookings/events/booking-created.event';
import { BookingChangedEvent } from '../../bookings/events/booking-changed.event';

describe('QueueGateway', () => {
  let gateway: QueueGateway;
  let queueTokenService: jest.Mocked<QueueTokenService>;
  let queueService: jest.Mocked<QueueService>;
  let serverMock: any;
  let clientMock: any;

  beforeEach(async () => {
    jest.useFakeTimers();

    queueTokenService = {
      verifyToken: jest.fn(),
      mintToken: jest.fn(),
    } as any;

    queueService = {
      computePositionForBooking: jest.fn(),
      computeSnapshot: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueGateway,
        { provide: QueueTokenService, useValue: queueTokenService },
        { provide: QueueService, useValue: queueService },
      ],
    }).compile();

    gateway = module.get<QueueGateway>(QueueGateway);

    serverMock = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };
    gateway.server = serverMock;

    clientMock = {
      handshake: {
        auth: { token: 'valid_token' },
        headers: {},
      },
      join: jest.fn().mockResolvedValue(undefined),
      emit: jest.fn(),
      disconnect: jest.fn(),
    };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('handleConnection', () => {
    it('authenticates client, joins rooms, and emits initial position', async () => {
      queueTokenService.verifyToken.mockReturnValue({
        sub: 'b_1',
        businessId: 'biz_1',
        role: 'customer',
        iat: 100,
        exp: 200,
      });

      const mockPos = {
        bookingId: 'b_1',
        position: 1,
        peopleAhead: 0,
        estimatedWaitMin: 0,
        slotStart: '2026-07-20T09:00:00.000Z',
      };
      queueService.computePositionForBooking.mockResolvedValue(mockPos as any);
      queueService.computeSnapshot.mockResolvedValue({
        businessId: 'biz_1',
        totalActive: 5,
        lastUpdatedAt: '2026-07-20T09:00:00.000Z',
      });

      await gateway.handleConnection(clientMock);

      expect(queueTokenService.verifyToken).toHaveBeenCalledWith('valid_token');
      expect(clientMock.join).toHaveBeenCalledWith('queue:business:biz_1');
      expect(clientMock.join).toHaveBeenCalledWith('queue:booking:b_1');
      expect(queueService.computePositionForBooking).toHaveBeenCalledWith('b_1');
      expect(clientMock.emit).toHaveBeenCalledWith('queue.position', mockPos);

      // Fast-forward 2 seconds to trigger throttled snapshot
      jest.advanceTimersByTime(2000);
      await Promise.resolve(); // flush async microtasks

      expect(queueService.computeSnapshot).toHaveBeenCalledWith('biz_1');
      expect(serverMock.to).toHaveBeenCalledWith('queue:business:biz_1');
      expect(serverMock.emit).toHaveBeenCalledWith('queue.snapshot', {
        businessId: 'biz_1',
        totalActive: 5,
        lastUpdatedAt: '2026-07-20T09:00:00.000Z',
      });
    });

    it('rejects connection when token is missing', async () => {
      clientMock.handshake.auth = {};
      clientMock.handshake.headers = {};

      await gateway.handleConnection(clientMock);

      expect(clientMock.emit).toHaveBeenCalledWith('exception', {
        status: 'error',
        code: 'QUEUE_TOKEN_INVALID',
        message: 'Missing token',
      });
      expect(clientMock.disconnect).toHaveBeenCalledWith(true);
    });

    it('rejects connection when token verification fails', async () => {
      queueTokenService.verifyToken.mockImplementation(() => {
        throw new Error('Token expired');
      });

      await gateway.handleConnection(clientMock);

      expect(clientMock.emit).toHaveBeenCalledWith('exception', {
        status: 'error',
        code: 'QUEUE_TOKEN_INVALID',
        message: 'Token expired',
      });
      expect(clientMock.disconnect).toHaveBeenCalledWith(true);
    });
  });

  describe('handleBookingCreated', () => {
    it('emits position to booking room and schedules snapshot', async () => {
      const mockPos = {
        bookingId: 'b_2',
        position: 2,
        peopleAhead: 1,
        estimatedWaitMin: 15,
        slotStart: '2026-07-20T09:15:00.000Z',
      };
      queueService.computePositionForBooking.mockResolvedValue(mockPos as any);

      const event = new BookingCreatedEvent(
        'b_2',
        'biz_1',
        'srv_1',
        '2026-07-20T09:15:00.000Z',
      );

      await gateway.handleBookingCreated(event);

      expect(queueService.computePositionForBooking).toHaveBeenCalledWith('b_2');
      expect(serverMock.to).toHaveBeenCalledWith('queue:booking:b_2');
      expect(serverMock.emit).toHaveBeenCalledWith('queue.position', mockPos);
    });
  });

  describe('handleBookingChanged', () => {
    it('broadcasts status change to business room and position to booking room', async () => {
      const mockPos = {
        bookingId: 'b_1',
        position: 0,
        peopleAhead: 0,
        estimatedWaitMin: 0,
        slotStart: '2026-07-20T09:00:00.000Z',
      };
      queueService.computePositionForBooking.mockResolvedValue(mockPos as any);

      const event = new BookingChangedEvent(
        'b_1',
        'biz_1',
        'CHECKED_IN',
        '2026-07-20T09:00:00.000Z',
      );

      await gateway.handleBookingChanged(event);

      expect(serverMock.to).toHaveBeenCalledWith('queue:business:biz_1');
      expect(serverMock.emit).toHaveBeenCalledWith('queue.booking.changed', {
        bookingId: 'b_1',
        status: 'CHECKED_IN',
        slotStart: '2026-07-20T09:00:00.000Z',
      });
      expect(queueService.computePositionForBooking).toHaveBeenCalledWith('b_1');
      expect(serverMock.to).toHaveBeenCalledWith('queue:booking:b_1');
      expect(serverMock.emit).toHaveBeenCalledWith('queue.position', mockPos);
    });
  });

  describe('snapshot throttling', () => {
    it('throttles snapshot emission to max once per 2 seconds per business', async () => {
      queueService.computeSnapshot.mockResolvedValue({
        businessId: 'biz_1',
        totalActive: 3,
        lastUpdatedAt: '2026-07-20T09:00:00.000Z',
      });

      const event1 = new BookingCreatedEvent('b_1', 'biz_1', 'srv_1', '2026-07-20T09:00:00.000Z');
      const event2 = new BookingCreatedEvent('b_2', 'biz_1', 'srv_1', '2026-07-20T09:15:00.000Z');

      await gateway.handleBookingCreated(event1);
      await gateway.handleBookingCreated(event2);

      expect(queueService.computeSnapshot).not.toHaveBeenCalled();

      // Advance by 2s
      jest.advanceTimersByTime(2000);
      await Promise.resolve();

      expect(queueService.computeSnapshot).toHaveBeenCalledTimes(1);
    });
  });
});
