import { UseFilters } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';
import { QueueTokenService } from './queue-token.service';
import { QueueService } from './queue.service';
import { WsExceptionFilter } from '../common/filters/ws-exception.filter';
import { BookingCreatedEvent } from '../bookings/events/booking-created.event';
import { BookingChangedEvent } from '../bookings/events/booking-changed.event';

@WebSocketGateway({
  namespace: '/queue',
  cors: { origin: process.env.WEB_ORIGIN || '*' },
})
@UseFilters(WsExceptionFilter)
export class QueueGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly snapshotTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly queueTokenService: QueueTokenService,
    private readonly queueService: QueueService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers['x-queue-token'];

      if (!token || typeof token !== 'string') {
        this.rejectClient(client, 'QUEUE_TOKEN_INVALID', 'Missing token');
        return;
      }

      const claims = this.queueTokenService.verifyToken(token);

      const businessRoom = `queue:business:${claims.businessId}`;
      const bookingRoom = `queue:booking:${claims.sub}`;

      await client.join(businessRoom);
      await client.join(bookingRoom);

      const pos = await this.queueService.computePositionForBooking(claims.sub);
      client.emit('queue.position', pos);

      this.scheduleSnapshotBroadcast(claims.businessId);
    } catch (err: any) {
      this.rejectClient(
        client,
        'QUEUE_TOKEN_INVALID',
        err.message || 'Authentication failed',
      );
    }
  }

  handleDisconnect(_client: Socket) {
    // Rooms are automatically cleaned up by Socket.IO
  }

  @OnEvent('booking.created')
  async handleBookingCreated(event: BookingCreatedEvent) {
    this.scheduleSnapshotBroadcast(event.businessId);

    try {
      const pos = await this.queueService.computePositionForBooking(
        event.bookingId,
      );
      this.server
        .to(`queue:booking:${event.bookingId}`)
        .emit('queue.position', pos);
    } catch {
      // No action needed if position computation fails
    }
  }

  @OnEvent('booking.changed')
  async handleBookingChanged(event: BookingChangedEvent) {
    this.scheduleSnapshotBroadcast(event.businessId);

    this.server
      .to(`queue:business:${event.businessId}`)
      .emit('queue.booking.changed', {
        bookingId: event.bookingId,
        status: event.status,
        slotStart: event.slotStart,
      });

    try {
      const pos = await this.queueService.computePositionForBooking(
        event.bookingId,
      );
      this.server
        .to(`queue:booking:${event.bookingId}`)
        .emit('queue.position', pos);
    } catch {}
  }

  private scheduleSnapshotBroadcast(businessId: string) {
    if (this.snapshotTimers.has(businessId)) return;

    const timer = setTimeout(async () => {
      this.snapshotTimers.delete(businessId);
      try {
        const snapshot = await this.queueService.computeSnapshot(businessId);
        this.server
          .to(`queue:business:${businessId}`)
          .emit('queue.snapshot', snapshot);
      } catch {}
    }, 2000);

    this.snapshotTimers.set(businessId, timer);
  }

  private rejectClient(client: Socket, code: string, message: string) {
    client.emit('exception', { status: 'error', code, message });
    client.disconnect(true);
  }
}
