import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EmailService } from '../email.service';

@Injectable()
export class EmailListener {
  private readonly logger = new Logger(EmailListener.name);

  constructor(private readonly emailService: EmailService) {}

  // TODO: Implement the email sending logic when a user is verified
  @OnEvent('user.verified', { async: true })
  async handleUserVerified() {}

  // TODO: Add more email event handlers as needed to match into `email.service.ts`, such as for password resets, notifications, etc.
}
