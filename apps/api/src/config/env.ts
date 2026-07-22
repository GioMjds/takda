// Zod-validated env loader. Imported by ConfigModule.forRoot() and
// re-exported as a typed `ENV` constant so app code never reads
// `process.env` directly.
//
// Keep this file in sync with `.env.example` (kept in `.gitignore`
// locally; the example is committed). All required keys are listed
// in `envSchema` and will crash the process at boot if missing.

import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(5000),

  DATABASE_URL: z.url(),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be ≥32 chars'),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(86400), // 1 day
  JWT_REFRESH_TTL_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(60 * 60 * 24 * 30), // 30 days

  SMS_PROVIDER: z.enum(['semaphore', 'twilio']).default('semaphore'),
  SMS_API_KEY: z.string().optional(), // Semaphore API key; required to actually send.
  // Master switch. When false (default outside production) messages are
  // persisted and logged but not dispatched to the provider — keeps dev/test
  // from spending SMS credits or requiring network access.
  SMS_ENABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  // Semaphore: registered sender name (defaults to the account's assigned name).
  SMS_SENDER_NAME: z.string().optional(),
  SMS_SEMAPHORE_BASE_URL: z.url().default('https://api.semaphore.co/api/v4'),
  // Twilio.
  SMS_TWILIO_ACCOUNT_SID: z.string().optional(),
  SMS_TWILIO_AUTH_TOKEN: z.string().optional(),
  SMS_TWILIO_FROM: z.string().optional(), // E.164 sender number.

  CORS_ORIGINS: z.string().default('http://localhost:3000'),
});

export type Env = z.infer<typeof envSchema>;

export const ENV: Env = envSchema.parse(process.env);
