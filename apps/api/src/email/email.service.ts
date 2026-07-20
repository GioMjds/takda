import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter<any>;
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {
    const secure = this.configService.get<string>('EMAIL_SECURE') === 'true';

    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('EMAIL_HOST'),
      port: this.configService.get<number>('EMAIL_PORT'),
      secure: secure,
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASS'),
      },
    });
  }

  // TODO: Send an email using the configured transporter
  async sendOtpEmail(
    to: string,
    name: string,
    otp: string,
  ) {
    const from = this.configService.get<string>('EMAIL_FROM');

    // TODO: Must styled an HTML template for the email content
    const html = ``;

    try {
      await this.transporter.sendMail({
        from: from,
        to: to,
        subject: 'Your OTP Code',
        html: html,
      });
    } catch (error) {
      this.logger.error('Error sending OTP email:', error);
      throw new Error('Failed to send OTP email');
    }
  }

  // TODO: Add more email sending methods as needed, such as for password resets, notifications, etc.
}
