import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { normalizePhone } from '@takda/shared';
import { renderSmsTemplate, SmsTemplateId } from './sms-templates';
import { SMS_PROVIDER, SmsProvider } from './sms-provider';

export interface SendSmsArgs {
  tenantId: string;
  businessId: string;
  bookingId?: string | null;
  toPhone: string;
  templateId: SmsTemplateId;
  vars: Record<string, string | number>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(SMS_PROVIDER) private readonly sms: SmsProvider,
  ) {}

  async sendSms(args: SendSmsArgs): Promise<string | null> {
    const toPhone = normalizePhone(args.toPhone);
    const body = renderSmsTemplate(args.templateId, args.vars);

    let messageId: string | null = null;
    try {
      const message = await this.prisma.message.create({
        data: {
          tenantId: args.tenantId,
          businessId: args.businessId,
          bookingId: args.bookingId ?? null,
          toPhone,
          templateId: args.templateId,
          vars: args.vars,
          body,
          status: 'PENDING',
        },
        select: { id: true },
      });
      messageId = message.id;
    } catch (err: any) {
      this.logger.error(`Failed to persist message: ${err?.message}`);
      return null;
    }

    try {
      const result = await this.sms.send(toPhone, body);
      await this.prisma.message.update({
        where: { id: messageId },
        data: result.accepted
          ? {
              status: 'SENT',
              sentAt: new Date(),
              providerMessageId: result.providerMessageId,
            }
          : { status: 'FAILED', error: result.error?.slice(0, 500) ?? 'unknown' },
      });
    } catch (err: any) {
      this.logger.error(`SMS dispatch failed for ${messageId}: ${err?.message}`);
      await this.prisma.message
        .update({
          where: { id: messageId },
          data: { status: 'FAILED', error: String(err?.message).slice(0, 500) },
        })
        .catch(() => undefined);
    }

    return messageId;
  }
}
