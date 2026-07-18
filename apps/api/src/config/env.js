'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.ENV = void 0;
const zod_1 = require('zod');
const envSchema = zod_1.z.object({
  NODE_ENV: zod_1.z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: zod_1.z.coerce.number().int().positive().default(3000),
  DATABASE_URL: zod_1.z.url(),
  JWT_SECRET: zod_1.z.string().min(32, 'JWT_SECRET must be ≥32 chars'),
  JWT_ACCESS_TTL_SECONDS: zod_1.z.coerce.number().int().positive().default(900),
  JWT_REFRESH_TTL_SECONDS: zod_1.z.coerce
    .number()
    .int()
    .positive()
    .default(60 * 60 * 24 * 30),
  SMS_PROVIDER: zod_1.z.enum(['semaphore', 'twilio']).default('semaphore'),
  SMS_API_KEY: zod_1.z.string().optional(),
  CORS_ORIGINS: zod_1.z.string().default('http://localhost:3000'),
});
exports.ENV = envSchema.parse(process.env);
//# sourceMappingURL=env.js.map
