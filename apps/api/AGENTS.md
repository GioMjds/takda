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

| Concern               | Choice                                                     |
| --------------------- | ---------------------------------------------------------- |
| Framework             | NestJS 11                                                  |
| Language              | TypeScript (`strict`, decorator metadata on)               |
| Transport             | HTTP (`@nestjs/platform-express`) + WS                     |
| ORM                   | Prisma 7 (`@prisma/client` + `@prisma/adapter-pg`)         |
| DB                    | PostgreSQL                                                 |
| Validation            | Zod 4 (via `@takda/shared`) — not `class-validator`        |
| Auth                  | `@nestjs/jwt` + cookie or `Authorization: Bearer`          |
| Rate limit            | `@nestjs/throttler` (per-IP and per-account)               |
| Security headers      | `helmet`                                                   |
| Compression           | `compression`                                              |
| Job queue             | BullMQ + Redis (`ioredis`)                                 |
| Real-time             | `@nestjs/websockets` (Socket.IO adapter)                   |
| Architecture          | Modular Monolith + optional `@nestjs/cqrs` for domain core |
| Idempotency           | `@node-idempotency/nestjs`                                 |
| Scheduled tasks       | `@nestjs/schedule` + BullMQ delayed jobs                   |
| Email (transactional) | `nodemailer` (TBD; behind `MailService`)                   |
| Password hashing      | `bcrypt`                                                   |
| Cookies / sessions    | `cookie-parser`                                            |

---

## 2. Directory layout

```folder
apps/api/
├── prisma/
│   ├── schema.prisma          # the only place models are defined
│   ├── migrations/            # committed; do not hand-edit
│   └── seed.ts                # idempotent dev seed
├── src/
│   ├── main.ts                # bootstrap, helmet, cors, global pipes, filters
│   ├── app.module.ts          # root module — composes feature modules
│   ├── config/                # typed env loader, validation w/ Zod
│   ├── prisma/                # PrismaService (DI-friendly)
│   ├── redis/                 # RedisService + BullMQ registration
│   ├── auth/                  # auth module (JWT, guards, strategies)
│   ├── tenants/               # tenant resolution (header / subdomain)
│   ├── businesses/            # CRUD + business-scoped queries
│   ├── services/              # service definitions (the bookable thing)
│   ├── slots/                 # capacity + slot generation
│   ├── bookings/              # core booking logic (optional CQRS handlers)
│   │   ├── commands/          # CreateBookingCommand, CancelBookingCommand
│   │   ├── queries/           # GetBookingStatusQuery, GetLiveQueueQuery
│   │   └── events/            # BookingCreatedEvent, BookingStatusChangedEvent
│   ├── queue/                 # live queue queries + WebSocket gateway
│   ├── notifications/         # NotificationsService, SMS provider adapter
│   ├── reminders/             # BullMQ workers, scheduling, dedupe
│   ├── webhooks/              # inbound SMS delivery status, etc.
│   ├── common/                # filters, interceptors, pipes, decorators
│   │   ├── decorators/        # @CurrentUser, @TenantId, @IdempotencyKey, @Public
│   │   ├── filters/           # HttpExceptionFilter, ZodErrorFilter, WsExceptionFilter
│   │   ├── interceptors/      # LoggingInterceptor, AuditInterceptor, TimeoutInterceptor
│   │   └── pipes/             # ZodValidationPipe
│   └── health/                # /health, /ready, /metrics
├── test/                      # e2e tests (Jest, supertest)
├── nest-cli.json
├── eslint.config.mjs
└── tsconfig.json              # extends ../../tsconfig.json
```

A **feature module** owns its controller, service, DTOs, optional CQRS handlers, and tests.
Cross-feature calls go through the other module's exported service or EventBus,
never through another module's controller.

---

## 3. NestJS Core Fundamentals & Architectural Concepts

### 3.1 Dependency Injection & Provider Scopes

- **Scope**: Use `DEFAULT` (singleton) scope for providers by default to maximize performance and minimize memory churn. Avoid `REQUEST` scope unless strictly necessary (e.g. request-bound context that cannot be passed as method parameters), as request-scoped providers instantiate sub-trees on every HTTP request.
- **Custom Providers & Tokens**: When abstracting third-party or volatile services (e.g., SMS providers), define provider interfaces and inject via symbol or string tokens (e.g. `SMS_PROVIDER_TOKEN`).
- **Module Encapsulation**: Modules must explicitly export services in `@Module({ exports: [...] })`. Never reach inside another module's internal providers or controllers.

### 3.2 Controllers & Thin Controller Pattern

- Controllers are strictly entry points. They handle route mapping, parameter extraction via decorators (`@Body()`, `@Query()`, `@Param()`, `@CurrentUser()`), pipe execution, and delegating to services or command/query buses.
- **No business logic in controllers**. Validation occurs in pipes; domain logic occurs in services/handlers.
- Return plain objects/arrays or typed DTOs. Never inject raw HTTP response objects (`@Res()`) unless streaming binary data or handling low-level headers, as it disables Nest's automatic response handling lifecycle and interceptors.

### 3.3 Custom Decorators

- Create reusable parameter decorators using `createParamDecorator` (e.g., `@CurrentUser()`, `@TenantId()`, `@IdempotencyKey()`) to extract validated request metadata cleanly.
- Combine metadata decorators with custom guards (e.g., `@Public()`, `@Roles('owner')`) using `Reflector`.

---

## 4. Pipeline Lifecycle & Request Processing

The execution lifecycle order for requests in NestJS:
`Middleware` $\rightarrow$ `Guards` $\rightarrow$ `Interceptors (Pre-controller)` $\rightarrow$ `Pipes` $\rightarrow$ `Controller / Route Handler` $\rightarrow$ `Interceptors (Post-controller)` $\rightarrow$ `Exception Filters`

### 4.1 Middleware

- Use middleware for early request processing prior to guard execution (e.g. correlation ID / request ID assignment using `nestjs-cls`, tenant subdomain resolution, raw body parsing for webhooks).
- Register global middleware in `main.ts` or bind to specific route patterns inside `AppModule.configure(consumer: MiddlewareConsumer)`.

### 4.2 Guards (`CanActivate`)

- Handle authentication and authorization.
- Use `ExecutionContext` to inspect request metadata, route handler handlers, and custom reflector metadata across HTTP and WebSocket contexts.
- Apply `@Public()` custom decorator to opt out of default authentication guards (e.g. `/auth/login`, `/health`).
- **Authorization Boundary**: Guards confirm identity, valid JWT signatures, and tenant membership. Granular resource authorization (e.g., "Can user X edit booking Y?") belongs in the service layer or CQRS command handler.

### 4.3 Interceptors (`NestInterceptor`)

- Transform response payloads, attach performance timing headers, or log audit trails using RxJS operators (`tap`, `map`, `catchError`).
- Use `LoggingInterceptor` to log structured HTTP method, path, response status, and duration in JSON format.

### 4.4 Pipes (`PipeTransform` & Zod Validation)

- All validation must pass through `ZodValidationPipe` (in `common/pipes/`) using Zod schemas imported from `@takda/shared`.
- **Do not use `class-validator` or `class-transformer`**.
- The pipe must strip unvalidated properties (`z.strict()` or `.strip()`) to prevent field smuggling.

### 4.5 Exception Filters (`ExceptionFilter`)

- The global `HttpExceptionFilter` formats all HTTP errors into a standard response shape: `{ statusCode, code, message, details? }`.
- Clients branch on machine-readable `code` strings (e.g., `SLOT_FULL`, `UNAUTHORIZED`, `VALIDATION_ERROR`).
- Unhandled internal errors produce a 500 status with a unique `correlationId`. Stack traces and raw DB errors are logged internally at `error` level and never exposed to clients.

---

## 5. Validation (The Zod-Only Rule)

This codebase validates input with **Zod**, not `class-validator`. The `@takda/shared` package is the single source of truth.

- HTTP DTOs are Zod schemas imported from `@takda/shared` and applied through `ZodValidationPipe`.
- `@Body()`, `@Query()`, `@Param()` decorators all run through that pipe. The pipe throws a `BadRequestException` with Zod issues attached; the global exception filter formats the response.
- If a controller needs input that `@takda/shared` doesn't define, **add the schema to `@takda/shared` first**, then import it. Local `z.object({...})` definitions in controllers are strictly prohibited.

---

## 6. Prisma & Data Access

- All models live in `prisma/schema.prisma`. Migrations live in `prisma/migrations/`. **Do not hand-edit** generated migrations.
- `PrismaService` extends `PrismaClient` and is registered as a Nest provider. Inject it; never construct it ad hoc.
- Use **transactional** operations (`prisma.$transaction`) for any multi-row write that must be atomic — booking creation, slot reservation, capacity adjustment.
- For high-contention paths (e.g. booking creation), use database-level locking (`SELECT ... FOR UPDATE`) or explicit compound unique constraints (e.g. `(serviceId, slotStart)`) to prevent double-booking.
- Always read with **explicit `select`** for hot endpoints. The dashboard queue must not fetch unneeded columns.
- **Time fields** are `timestamptz` in Postgres and `DateTime` in Prisma. Render in UTC; the web client formats to `Asia/Manila`.

---

## 7. Auth & Security Hardening

- **JWT Sessions**: Short-lived (15 min) access tokens + 30-day refresh tokens stored hashed in Postgres.
- **Guards**: `JwtAuthGuard` protects routes by default. `@Public()` opts out.
- **Multi-Tenancy Isolation**: Requests resolve tenant from subdomain (`acme.takda.app`) or `X-Tenant-Id` header (in dev). The `@TenantId()` decorator extracts this context. Service methods enforce business isolation scoping on all queries.
- **Rate Limiting**: Protect endpoints against abuse with `@nestjs/throttler`. Apply strict limits to sensitive routes (auth, booking creation, SMS triggers).
- **Security Headers & CORS**: `helmet` is registered globally at bootstrap. CORS rules restrict origin access strictly to whitelisted domain origins.
- **Data Protection & Sanitization**: Ensure PII (phone numbers, names) in logs is masked or structured properly. Prevent injection attacks by leveraging Prisma parameterized queries.

---

## 8. Idempotency

- All **POST** endpoints that create a booking, send an SMS, or schedule a reminder are wrapped with `@node-idempotency/nestjs`. The client supplies an `Idempotency-Key` header.
- The store is Postgres (via the provided adapter) so an in-flight retry on a flaky network doesn't double-book a slot.
- The response for a re-sent request with an identical idempotency key is the **exact cached response body** of the original call.

---

## 9. The Booking Flow (Core Domain Logic)

1. Customer submits `POST /businesses/:slug/services/:id/bookings` with `{ slotStart, name, phone }`.
2. Controller validates with the shared Zod schema + idempotency key.
3. `BookingsService` (or `CreateBookingCommandHandler` if using CQRS):
   1. Opens a database transaction.
   2. Re-reads the slot in the transaction with `SELECT ... FOR UPDATE` (or relies on a unique index on `(serviceId, slotStart)`).
   3. If the slot is taken $\rightarrow$ 409 `SLOT_TAKEN`.
   4. If capacity is exhausted $\rightarrow$ 409 `SLOT_FULL`.
   5. Inserts the booking with `status: "pending"`.
   6. Commits transaction.
4. `NotificationsService` enqueues a BullMQ job to send the confirmation SMS. On success, booking status flips to `"confirmed"`.
5. A delayed BullMQ job for the **reminder** is scheduled with `delay = slotStart - REMINDER_LEAD_MINUTES`.
6. The WebSocket gateway broadcasts a `queue.updated` / `booking.changed` event to the business owner channel.

**Rules of the road:**

- Capacity and slot generation is **derived from service config + a per-day override table**, materialized for the next 14 days on demand and cached in Redis.
- Cancellations and no-shows are explicit transitions; bookings are never deleted.
- Walk-ins use the `bookings` table with `source: "walk_in"` and a synthetic slot.

---

## 10. CQRS & Event-Driven Patterns (Application Guidelines)

CQRS (Command Query Responsibility Segregation) via `@nestjs/cqrs` is appropriate for core business domains with high concurrency or multi-step asynchronous workflows (e.g. Booking Engine & Queue Management).

- **Commands & Handlers (`ICommandHandler`)**:
  - Express write operations (`CreateBookingCommand`, `UpdateBookingStatusCommand`).
  - Handlers execute transactional domain updates and emit events on success.
- **Queries & Handlers (`IQueryHandler`)**:
  - Express read operations (`GetLiveQueueQuery`, `GetDailyCapacityQuery`).
  - Optimized for read performance using direct Prisma `select` queries or Redis caching layer.
- **Events & EventBus (`IEventHandler`)**:
  - Domain events (`BookingCreatedEvent`, `BookingCancelledEvent`) are published via `EventBus`.
  - Decouple secondary side-effects (BullMQ SMS job scheduling, WebSocket live updates, audit logging) from the primary command handler transaction.

---

## 11. Real-Time WebSockets (`@nestjs/websockets`)

- **Gateway Configuration**: `@WebSocketGateway({ namespace: '/queue' })` using Socket.IO.
- **Authentication**: `WsJwtGuard` validates JWT credentials during the connection handshake. Unauthenticated socket connection requests are rejected immediately.
- **Rooms & Subscriptions**: Sockets join room `/queue/:businessId`.
- **Events Emitted**:
  - `queue.updated`: Full snapshot of today's confirmed + pending bookings.
  - `booking.changed`: Delta payload (`{ id, status }`) for lightweight client-side state updates.
- **WS Exception Handling**: Apply `WsExceptionFilter` (`@UseFilters(WsExceptionFilter)`) to WebSocket gateways so socket handlers emit structured `{ status: 'error', code, message }` frames back to the client without dropping the socket connection.

---

## 12. Notifications (SMS)

- `NotificationsService` abstracts provider integration (`SMS_PROVIDER`). Supported adapters: Semaphore (PH) and Twilio PH.
- Callers invoke `notifications.sendSms(to, template, vars)`.
- Every SMS has a stable `templateId` and structured `vars`. `Message` table tracks provider message IDs for webhook delivery status callbacks.
- **Transactional only**: Confirmations, reminders, and status changes. No marketing SMS.

---

## 13. BullMQ Workers & Job Scheduling

- `RemindersProcessor` processes background queue operations using `@Processor('reminders')`.
- **Idempotent Job Keys**: Job IDs are deterministically formatted as `${bookingId}:${kind}` (e.g. `b_123:T-60`). Enqueuing duplicate keys is a no-op.
- **Failure Recovery**: Configured with exponential backoff retries. Dead-letter/failed jobs are logged with detailed context for operational debugging.
- **Scheduled Tasks**: Use `@nestjs/schedule` (`@Cron()`) or delayed BullMQ jobs for recurring maintenance tasks.

---

## 14. Error Handling & Resilience

- Global `HttpExceptionFilter` converts errors to consistent `{ statusCode, code, message, details? }` format.
- `ZodError` maps to a 400 response with `code: "VALIDATION_ERROR"` and an issues array.
- No internal stack traces in production HTTP responses.
- Unhandled exceptions generate a logged `correlationId` returned in a 500 response.

---

## 15. Observability & Telemetry

- Structured JSON logs via `pino` or Nest `Logger`.
- Request tracing via `nestjs-cls` attaches `requestId` across HTTP requests, WS sessions, and BullMQ jobs.
- Health probes: `/health` (liveness) and `/ready` (readiness checking Postgres and Redis connection pools).
- Prometheus metrics exposed at `/metrics` via `@willsoto/nestjs-prometheus`.

---

## 16. Testing Strategy

- **Unit Tests (`*.spec.ts`)**: Test services, guards, pipes, and CQRS handlers in isolation. Mock `PrismaService`, `RedisService`, and `NotificationsService` with Jest mocks.
- **Integration & E2E Tests (`test/*.e2e-spec.ts`)**: Spin up the Nest testing module against a real test database (Postgres schema/container). Execute full API and booking flows.
- **CI Enforcement**: Tests must run without network dependency. Mock external SMS gateways and external APIs.

---

## 17. Don'ts

- Don't use `class-validator` or `class-transformer`. Zod schemas in `@takda/shared` are mandatory.
- Don't put business logic in controllers or WebSocket gateways.
- Don't use `REQUEST` scope providers unless strictly necessary.
- Don't perform database writes without atomic transactions (`prisma.$transaction`) or concurrency safeguards on high-contention paths.
- Don't hand-edit generated Prisma migrations.
- Don't reach for unapproved ORMs, job queues, or transport layers.
- Don't leak raw database entities or stack traces to HTTP clients.

---

## 18. Common Tasks Checklist

- **Add an Endpoint**: Define Zod schema in `@takda/shared` $\rightarrow$ add thin controller method $\rightarrow$ delegate to service / CQRS handler $\rightarrow$ add unit test $\rightarrow$ add E2E test.
- **Add a Model**: Edit `prisma/schema.prisma` $\rightarrow$ run `pnpm --filter @takda/api prisma:migrate dev --name <name>` $\rightarrow$ export public Zod shape in `@takda/shared`.
- **Add a Queue Worker**: Register queue in Redis module $\rightarrow$ create `@Processor()` class $\rightarrow$ register in feature module $\rightarrow$ enforce deterministic job keys.
- **Add a Webhook Handler**: Create dedicated controller $\rightarrow$ verify webhook signature in middleware/guard $\rightarrow$ delegate payload to background worker.
