import { Logger } from '@nestjs/common';
import { ENV } from '../config/env';

export interface SmsSendResult {
  /// Provider-side message id, when the provider returns one.
  providerMessageId: string | null;
  /// True when the provider accepted the message for delivery.
  accepted: boolean;
  error?: string;
}

export interface SmsProvider {
  send(toPhone: string, body: string): Promise<SmsSendResult>;
}

/// Used in dev/test (and whenever SMS_ENABLED=false). Persists nothing, just
/// logs so flows can be exercised without spending credits or network access.
export class NoopSmsProvider implements SmsProvider {
  private readonly logger = new Logger('NoopSmsProvider');

  async send(toPhone: string, body: string): Promise<SmsSendResult> {
    this.logger.debug(`[noop sms] → ${toPhone}: ${body}`);
    return { providerMessageId: null, accepted: true };
  }
}

/// Semaphore (semaphore.co) — the default PH SMS gateway. Uses the v4 REST API.
export class SemaphoreSmsProvider implements SmsProvider {
  private readonly logger = new Logger('SemaphoreSmsProvider');

  async send(toPhone: string, body: string): Promise<SmsSendResult> {
    if (!ENV.SMS_API_KEY) {
      return { providerMessageId: null, accepted: false, error: 'SMS_API_KEY not set' };
    }

    try {
      const params = new URLSearchParams({
        apikey: ENV.SMS_API_KEY,
        number: toPhone,
        message: body,
      });
      if (ENV.SMS_SENDER_NAME) params.set('sendername', ENV.SMS_SENDER_NAME);

      const res = await fetch(`${ENV.SMS_SEMAPHORE_BASE_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });

      if (!res.ok) {
        const text = await res.text();
        return {
          providerMessageId: null,
          accepted: false,
          error: `Semaphore ${res.status}: ${text.slice(0, 200)}`,
        };
      }

      const data = (await res.json()) as Array<{ message_id?: number }>;
      const id = Array.isArray(data) && data[0]?.message_id;
      return { providerMessageId: id ? String(id) : null, accepted: true };
    } catch (err: any) {
      this.logger.error(`Semaphore send failed: ${err?.message}`);
      return { providerMessageId: null, accepted: false, error: err?.message };
    }
  }
}

/// Twilio — fallback / international. Uses the Messages REST resource.
export class TwilioSmsProvider implements SmsProvider {
  private readonly logger = new Logger('TwilioSmsProvider');

  async send(toPhone: string, body: string): Promise<SmsSendResult> {
    const sid = ENV.SMS_TWILIO_ACCOUNT_SID;
    const token = ENV.SMS_TWILIO_AUTH_TOKEN;
    const from = ENV.SMS_TWILIO_FROM;
    if (!sid || !token || !from) {
      return {
        providerMessageId: null,
        accepted: false,
        error: 'Twilio credentials not fully configured',
      };
    }

    try {
      const params = new URLSearchParams({ To: toPhone, From: from, Body: body });
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
          },
          body: params.toString(),
        },
      );

      const data = (await res.json()) as { sid?: string; message?: string };
      if (!res.ok) {
        return {
          providerMessageId: null,
          accepted: false,
          error: `Twilio ${res.status}: ${data?.message ?? 'error'}`,
        };
      }
      return { providerMessageId: data.sid ?? null, accepted: true };
    } catch (err: any) {
      this.logger.error(`Twilio send failed: ${err?.message}`);
      return { providerMessageId: null, accepted: false, error: err?.message };
    }
  }
}

/// Factory: picks the provider from env, or the noop provider when SMS is
/// disabled. Called once by the DI provider in NotificationsModule.
export function createSmsProvider(): SmsProvider {
  if (!ENV.SMS_ENABLED) return new NoopSmsProvider();
  return ENV.SMS_PROVIDER === 'twilio'
    ? new TwilioSmsProvider()
    : new SemaphoreSmsProvider();
}

export const SMS_PROVIDER = Symbol('SMS_PROVIDER');
