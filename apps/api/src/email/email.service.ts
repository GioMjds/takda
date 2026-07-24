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

  async sendOtpEmail(to: string, name: string, otp: string) {
    const from = this.configService.get<string>('EMAIL_FROM');
    const html = `<p>Hi ${name}, your OTP is <strong>${otp}</strong></p>`;

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

  async sendStaffInvite(
    to: string,
    businessName: string,
    acceptUrl: string,
  ): Promise<void> {
    const from = this.configService.get<string>('EMAIL_FROM');
    const html = `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>You've been invited to join ${businessName} on Takda</h2>
        <p>You have been invited to join <strong>${businessName}</strong> as a staff member.</p>
        <p>Click the link below to accept your invitation:</p>
        <p><a href="${acceptUrl}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Accept Invitation</a></p>
        <p>If you did not expect this invitation, you can safely ignore this email.</p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: from,
        to: to,
        subject: `Invitation to join ${businessName} on Takda`,
        html: html,
      });
    } catch (error) {
      this.logger.error(`Error sending staff invite email to ${to}:`, error);
      throw new Error('Failed to send staff invite email');
    }
  }
}
