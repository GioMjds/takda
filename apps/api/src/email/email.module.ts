import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailListener } from './listeners/email.listener';

@Module({
  providers: [
    EmailService,
    EmailListener,
    {
      provide: 'IEmailService',
      useExisting: EmailService,
    },
  ],
  exports: [EmailService],
})
export class EmailModule {}
