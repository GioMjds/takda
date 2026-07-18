import { z } from 'zod';
declare const envSchema: z.ZodObject<
  {
    NODE_ENV: z.ZodDefault<
      z.ZodEnum<{
        development: 'development';
        test: 'test';
        production: 'production';
      }>
    >;
    PORT: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    DATABASE_URL: z.ZodURL;
    JWT_SECRET: z.ZodString;
    JWT_ACCESS_TTL_SECONDS: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    JWT_REFRESH_TTL_SECONDS: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    SMS_PROVIDER: z.ZodDefault<
      z.ZodEnum<{
        semaphore: 'semaphore';
        twilio: 'twilio';
      }>
    >;
    SMS_API_KEY: z.ZodOptional<z.ZodString>;
    CORS_ORIGINS: z.ZodDefault<z.ZodString>;
  },
  z.core.$strip
>;
export type Env = z.infer<typeof envSchema>;
export declare const ENV: Env;
export {};
