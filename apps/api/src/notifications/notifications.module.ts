import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { createSmsProvider, SMS_PROVIDER } from './sms-provider';

@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    { provide: SMS_PROVIDER, useFactory: createSmsProvider },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
