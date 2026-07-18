# AGENTS.md - Takda API (apps/api)

> This file is **in addition to** the root [AGENTS.md](../../AGENTS.md).
> Read the root first — it has the monorepo rules, toolchain, and
> domain language. This file covers only what is specific to the API.

This workspace is the **NestJS 11** backend. It exposes:

- A **REST API** consumed by the web app (and by anyone with a token).
- A **WebSocket gateway** that pushes live queue updates to the owner
  dashboard.
- A **BullMQ worker** that schedules SMS reminders and no-show
  follow-ups.
- A **Prisma** data layer over Postgres.

Everything is one process for now (`main.ts`); the worker can be
split out later as a separate Node entry point without changing the
modules.

---

## 1. Stack snapshot

| Concern               | Choice                                              |
| --------------------- | --------------------------------------------------- |
| Framework             | NestJS 11                                           |
| Language              | TypeScript (`strict`, decorator metadata on)        |
| Transport             | HTTP (`@nestjs/platform-express`) + WS              |
| ORM                   | Prisma 7 (`@prisma/client` + `@prisma/adapter-pg`)  |
| DB                    | PostgreSQL                                          |
| Validation            | Zod 4 (via `@takda/shared`) — not `class-validator` |
| Auth                  | `@nestjs/jwt` + cookie or `Authorization: Bearer`   |
| Rate limit            | `@nestjs/throttler` (per-IP and per-account)        |
| Security headers      | `helmet`                                            |
| Compression           | `compression`                                       |
| Job queue             | BullMQ + Redis (`ioredis`)                          |
| Real-time             | `@nestjs/websockets` (Socket.IO adapter)            |
| Idempotency           | `@node-idempotency/nestjs`                          |
| Scheduled tasks       | `@nestjs/schedule` + BullMQ delayed jobs            |
| Email (transactional) | `nodemailer` (TBD; behind `MailService`)            |
| Password hashing      | `bcrypt`                                            |
| Cookies / sessions    | `cookie-parser`                                     |

---

## 2. Directory layout

```folder
apps/api/
├── prisma/
│   ├── schema.prisma          # the only place models are defined
│   ├── migrations/            # committed; do not hand-edit
│   └── seed.ts                # idempotent dev seed
├── src/
│   ├── main.ts                # bootstrap, helmet, cors, global pipes
│   ├── app.module.ts          # root module — composes feature modules
│   ├── config/                # typed env loader, validation w/ Zod
│   ├── prisma/                # PrismaService (DI-friendly)
│   ├── redis/                 # RedisService + BullMQ registration
│   ├── auth/                  # auth module (JWT, guards, strategies)
│   ├── tenants/               # tenant resolution (header / subdomain)
│   ├── businesses/            # CRUD + business-scoped queries
│   ├── services/              # service definitions (the bookable thing)
│   ├── slots/                 # capacity + slot generation
│   ├── bookings/              # the core: create, cancel, check-in, no-show
│   ├── queue/                 # live queue queries + WebSocket gateway
│   ├── notifications/         # NotificationsService, SMS provider adapter
│   ├── reminders/             # BullMQ workers, scheduling, dedupe
│   ├── webhooks/              # inbound SMS delivery status, etc.
│   ├── common/                # filters, interceptors, pipes, decorators
│   │   ├── decorators/        # @CurrentUser, @TenantId, @IdempotencyKey
│   │   ├── filters/           # HttpExceptionFilter, ZodErrorFilter
│   │   ├── interceptors/      # LoggingInterceptor, AuditInterceptor
│   │   └── pipes/             # ZodValidationPipe
│   └── health/                # /health, /ready, /metrics
├── test/                      # e2e tests (Jest, supertest)
├── nest-cli.json
├── eslint.config.mjs
└── tsconfig.json              # extends ../../tsconfig.json
```

A **feature module** owns its controller, service, DTOs, and tests.
Cross-feature calls go through the other module's exported service,
never through the controller.

---

## 3. Module conventions

- One folder per feature. The folder name is the module name in
  `@Module({ imports: [...] })`.
- Every controller method is **thin**: it parses input, delegates to a
  service, returns the result. No business logic in controllers.
- Every service method is **typed** end-to-end: it accepts Zod-
  validated input, returns plain TS types from `@takda/shared`.
- Modules expose only what other modules need via a `*.module.ts`'s
  `exports: [...]` array. Don't import a service directly across
  module boundaries.
- Feature modules do **not** import each other's `*.controller.ts`.
  Talk to services.

---

## 4. Validation (the Zod-only rule)

This codebase validates input with **Zod**, not `class-validator`. The
shared package is the single source of truth.

- HTTP DTOs are Zod schemas imported from `@takda/shared` and applied
  through a `ZodValidationPipe` (in `common/pipes/`).
- `@Body()`, `@Query()`, `@Param()` decorators all run through that
  pipe. The pipe throws a `BadRequestException` with the Zod issues
  attached; the global exception filter formats the response.
- If a controller needs input that the shared package doesn't define,
  **add the schema to `@takda/shared` first**, then import it. Local
  `z.object({...})` definitions in controllers are not allowed.
- The pipe must strip unknown keys (`z.strict()` or `.strip()`) so
  clients can't smuggle fields in.

---

## 5. Prisma

- All models live in `prisma/schema.prisma`. Migrations live in
  `prisma/migrations/`. **Do not hand-edit** generated migrations.
- `PrismaService` extends `PrismaClient` and is registered as a Nest
  provider. Inject it; never construct it ad hoc.
- Use **transactional** operations (`prisma.$transaction`) for any
  multi-row write that must be atomic — booking creation, slot
  reservation, capacity adjustment.
- For high-contention paths (the booking create), use a database-level
  lock or a unique constraint that prevents double-booking. Don't try
  to fix it with a "check then insert" pattern.
- Always read with **explicit `select`** for hot endpoints. The
  dashboard queue should not pull every column.
- **Time fields** are `timestamptz` in Postgres and `DateTime` in
  Prisma. Render in UTC; the web formats to Asia/Manila.

---

## 6. Auth & multi-tenancy

- Sessions are JWTs, signed with `JWT_SECRET`, short-lived (15 min) +
  refresh token (30 days). Refresh tokens are stored hashed.
- A `JwtAuthGuard` protects routes. A `@Public()` decorator opts out
  (for `/auth/login`, `/health`, etc.).
- Every business-scoped request resolves a **tenant** from the
  subdomain (`acme.takda.app`) **or** an `X-Tenant-Id` header in dev.
  The resolver is middleware; controllers never have to think about
  it. There's a `@TenantId()` decorator that reads it.
- Authorization checks (can this user do X in this business?) live
  in the service layer, not the controller. The controller asks
  "is the request well-formed?"; the service asks "is it allowed?".

---

## 7. Idempotency

- All **POST** endpoints that create a booking, send an SMS, or
  schedule a reminder are wrapped with
  `@node-idempotency/nestjs`. The client supplies `Idempotency-Key`.
- The store is Postgres (via the provided adapter) so an in-flight
  retry on a flaky network doesn't double-book a slot.
- Don't paper over idempotency by returning 200 on a re-send. The
  response should be the **same body** as the original.

---

## 8. The booking flow (the heart of the system)

This is the most important flow. Touch it carefully.

1. Customer submits `POST /businesses/:slug/services/:id/bookings`
   with `{ slotStart, name, phone }`.
2. Controller validates with the shared Zod schema + idempotency key.
3. BookingsService:
   1. Opens a transaction.
   2. Re-reads the slot in the transaction with
      `SELECT ... FOR UPDATE` (or relies on a unique index on
      `(serviceId, slotStart)`).
   3. If the slot is taken → 409.
   4. If the slot is full → 409 with `code: "SLOT_FULL"`.
   5. Otherwise inserts the booking with `status: "pending"`.
   6. Commits.
4. NotificationsService enqueues a BullMQ job to send the
   confirmation SMS. On success, the booking is flipped to
   `"confirmed"`. (If SMS fails, the booking stays `"pending"` and is
   retried.)
5. A separate BullMQ job for the **reminder** is scheduled with
   `delay = slotStart - REMINDER_LEAD_MINUTES`.
6. The WebSocket gateway broadcasts a `queue.updated` event to the
   business's owner channel.

**Rules of the road:**

- Capacity and slot generation is **derived from service config + a
  per-day override table**, not stored as a long list of slots. We
  materialize the next 14 days of slots on demand and cache in Redis.
- Cancellations and no-shows are explicit transitions; a booking
  cannot be deleted — only moved to a terminal status.
- Walk-ins (added by the owner) use the same `bookings` table with
  `source: "walk_in"` and a synthetic slot.

---

## 9. Real-time queue updates

- One WebSocket namespace per business: `/queue/:businessId`.
- Owner clients authenticate via the JWT cookie on the upgrade
  request. The `WsJwtGuard` rejects unauthenticated upgrades.
- Events emitted:
  - `queue.updated` — full ordered list of today's `confirmed` +
    `pending` bookings for the business.
  - `booking.changed` — `{ id, status }` for delta-style UIs.
- We do **not** send a full queue on every event. The client keeps
  its own ordered list and applies the deltas.
- The gateway writes through `QueueService` so the broadcast and the
  DB write are sequenced.

---

## 10. Notifications (SMS)

- `NotificationsService` is the only module that knows which SMS
  provider is configured. Callers say
  `notifications.sendSms(to, template, vars)`.
- The provider is selected at boot from `SMS_PROVIDER`. The
  Semaphore (PH) and Twilio adapters are the v1 targets.
- Every SMS has a stable `templateId` and a `vars` object so we can
  audit what was sent. The `Message` table records the result and
  the upstream provider's `messageId` for delivery status webhooks.
- **Never** send a marketing SMS. Reminders, confirmations, and
  cancellations only, for v1.

---

## 11. BullMQ workers

- `RemindersProcessor` consumes the `reminders` queue.
- Jobs are idempotent: a `bookingId` + `kind` (e.g. `T-60`, `T-10`,
  `no-show-follow-up`) is the natural key. A second enqueue for the
  same key is a no-op.
- On failure, BullMQ retries with exponential backoff up to N times
  (configured per queue). After that, the job is parked in the
  `failed` set and a structured error is logged.
- The worker uses the same `PrismaService` as the HTTP layer. We do
  **not** run a separate DB connection pool just for the worker.

---

## 12. Error handling

- A global `HttpExceptionFilter` formats every error as
  `{ statusCode, code, message, details? }`. The `code` is a stable
  machine-readable string (`SLOT_FULL`, `BOOKING_NOT_FOUND`,
  `IDEMPOTENCY_KEY_REUSED`, ...). Clients branch on `code`, not
  `message`.
- `ZodError` is mapped to a 400 with `code: "VALIDATION_ERROR"` and
  the issues array.
- Never leak stack traces in production. The logger middleware
  captures them; the response stays clean.
- Unhandled errors are logged at `error` level with a correlation
  id. The HTTP response is a generic 500 with the correlation id so
  support can find the log.

---

## 13. Observability

- Structured logs only (`pino` or Nest's built-in `Logger` in JSON
  mode — pick one and stick with it).
- Every request has a `requestId` (from `cls-hooked` or
  `nestjs-cls`) propagated through logs, the WS gateway, and
  outbound HTTP.
- `/health` is liveness; `/ready` checks Postgres and Redis.
- Metrics (Prometheus) are exposed at `/metrics` once the
  `@willsoto/nestjs-prometheus` package is added.

---

## 14. Testing

- **Unit tests** (`*.spec.ts` next to the file) for every service.
  Mock `PrismaService`, `RedisService`, and `NotificationsService`
  with Jest mocks. The point is to test the service's logic, not
  the database.
- **Integration tests** in `test/` spin up a Nest app against a
  **test database** (a separate Postgres schema or container).
  Use the real Prisma client, real migrations, fake SMS adapter.
- **E2E tests** cover the booking flow end-to-end: create service,
  set capacity, book a slot, simulate the reminder, mark
  checked-in. These tests are slow; they run in CI on every PR.
- Don't mock what you can use for real. Prefer a real test DB over a
  Prisma mock for anything that touches transactions or constraints.

---

## 15. Don'ts

- Don't add `class-validator` or `class-transformer`. The shared
  Zod schemas are the contract.
- Don't put business logic in controllers. Period.
- Don't call `prisma.booking.create(...)` from a controller.
- Don't ship a feature that writes to the DB without a transaction
  covering the related rows.
- Don't reach for a new ORM, queue, or transport. The stack in §1 is
  the stack.
- Don't hand-edit generated Prisma migrations.

---

## 16. Common tasks

- **Add an endpoint** → add the Zod schema to `@takda/shared`; add
  a controller method that delegates to a service; add a service
  test; add an e2e test if the endpoint is part of the booking flow.
- **Add a model** → edit `prisma/schema.prisma`, run
  `pnpm --filter @takda/api prisma:migrate dev -- --name <change>`,
  add a Zod schema in shared for the public shape (don't leak
  Prisma types over the wire).
- **Add a worker** → register the queue in `redis/`, add a
  processor class, register it in `RemindersModule` (or a new
  feature module). Idempotency first, retries second.
- **Add a new SMS template** → add it to `NotificationsService`'s
  template registry. The web doesn't compose SMS bodies.
