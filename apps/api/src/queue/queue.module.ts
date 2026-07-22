import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { QueueService } from './queue.service';
import { QueueTokenService } from './queue-token.service';
import { TicketNumberService } from './ticket-number.service';
import { QueueAdminService } from './queue-admin.service';
import { QueuePublicController } from './queue-public.controller';
import { QueueAdminController } from './queue-admin.controller';
import { QueueGateway } from './queue.gateway';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [JwtModule.register({}), NotificationsModule],
  controllers: [QueuePublicController, QueueAdminController],
  providers: [
    QueueService,
    QueueGateway,
    QueueTokenService,
    TicketNumberService,
    QueueAdminService,
  ],
  exports: [QueueService, QueueTokenService, TicketNumberService],
})
export class QueueModule {}
