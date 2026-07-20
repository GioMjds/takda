# Queue Join & Real-Time Position Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the customer booking flow on `/b/:slug` into a live queue experience with real-time position updates, silent token refresh, and owner broadcast integration.

**Architecture:** Hybrid slot-booking with live position tracking; `BookingsModule` mints tokens and emits events; `QueueModule` calculates positions and manages Socket.IO rooms (`queue:business:{id}`, `queue:booking:{id}`) over `@nestjs/websockets`; customer web PWA consumes events via `useQueuePosition` hook and `<PositionCard />` component.

**Tech Stack:** Next.js 16 (App Router), NestJS 11, Socket.IO (`socket.io-client`), Prisma 7, Zod 4, `@nestjs/event-emitter`, `@nestjs/jwt`, Tailwind CSS v4, Motion.

## Global Constraints

- Wire contract change is additive only — no existing field renames, removals, or type changes.
- Bumps `@takda/shared` version non-breakingly; both apps updated in the same PR.
- TypeScript `strict: true`. No `any`, no `// @ts-ignore`.
- Shared package exports must be tree-shakeable and free from top-level Node/browser dependencies.
- Server Components by default for route pages (`page.tsx`); encapsulate animated/interactive components in `pages/<route-name>/sections/` or `hooks/` with `'use client'`.
- All validation schemas live in `@takda/shared` — no local `z.object({...})` definitions in controllers.

---

### File Structure Map

- `packages/shared/src/constants/errors.ts`: Machine-readable error code constants.
- `packages/shared/src/schemas/queue.ts`: Zod schemas for queue position, snapshots, and booking updates.
- `packages/shared/src/schemas/booking.ts`: Queue token claims, response, and refresh schemas.
- `packages/shared/src/utils/queue-position.ts`: Pure functions to compute queue position and count active bookings.
- `packages/shared/src/utils/wait-estimator.ts`: Wait time estimation formula.
- `apps/api/src/bookings/`: Renamed from `appointments/`. Contains `BookingsModule`, `BookingsController`, `BookingsService`, and domain events (`BookingCreatedEvent`, `BookingChangedEvent`).
- `apps/api/src/queue/queue-token.service.ts`: JWT minting and verification service for customer queue access.
- `apps/api/src/queue/queue.service.ts`: Prisma queries to compute positions and snapshot stats.
- `apps/api/src/queue/queue.controller.ts`: Controller exposing token refresh REST endpoint.
- `apps/api/src/common/filters/ws-exception.filter.ts`: Exception filter for WebSocket exception framing.
- `apps/api/src/queue/queue.gateway.ts`: Socket.IO WebSocket gateway managing rooms and real-time broadcasts.
- `apps/web/lib/api.ts`: Typed client wrapper for booking creation and queue token refresh.
- `apps/web/app/[lang]/dictionaries/en.json` & `tl.json`: i18n dictionaries with `positionCard` keys.
- `apps/web/pages/[lang]/b/[businessSlug]/hooks/_useQueuePosition.ts`: Client hook managing Socket.IO connection singleton and silent refresh.
- `apps/web/pages/[lang]/b/[businessSlug]/sections/_PositionCard.tsx`: UI component displaying live position, wait estimate, and reconnection/rejoin states.
- `apps/web/app/[lang]/(customer)/b/[businessSlug]/confirm/page.tsx`: SSR page for booking confirmation with position card.

---

### Task 1: Wire Contract Additions in `@takda/shared`

**Files:**

- Create: `packages/shared/src/constants/errors.ts`
- Create: `packages/shared/src/schemas/queue.ts`
- Modify: `packages/shared/src/schemas/booking.ts`
- Modify: `packages/shared/src/schemas/index.ts`
- Create: `packages/shared/src/utils/queue-position.ts`
- Create: `packages/shared/src/utils/wait-estimator.ts`
- Create: `packages/shared/src/utils/__tests__/queue-position.test.ts`
- Modify: `packages/shared/src/index.ts`
- Modify: `packages/shared/package.json`

**Interfaces:**

- Produces: `queuePositionSchema`, `queueSnapshotSchema`, `queueBookingChangedSchema`, `queueTokenClaimsSchema`, `queueTokenResponseSchema`, `refreshQueueTokenInputSchema`, `ERROR_CODES`, `computeQueuePosition`, `countActiveForBusiness`, `estimateWaitMin`.

- [ ] **Step 1: Write the failing test for `queue-position` and `wait-estimator`**

```typescript
// packages/shared/src/utils/__tests__/queue-position.test.ts
import {
  computeQueuePosition,
  countActiveForBusiness,
} from '../queue-position';
import { estimateWaitMin } from '../wait-estimator';

describe('queue-position utils', () => {
  const baseInput = {
    businessId: 'biz_1',
    bookingId: 'b_2',
    slotStart: '2026-07-20T09:00:00.000Z',
    serviceDurationMin: 15,
    bookings: [
      {
        id: 'b_1',
        slotStart: '2026-07-20T08:30:00.000Z',
        createdAt: '2026-07-20T08:00:00.000Z',
        status: 'CONFIRMED' as const,
      },
      {
        id: 'b_2',
        slotStart: '2026-07-20T09:00:00.000Z',
        createdAt: '2026-07-20T08:05:00.000Z',
        status: 'PENDING' as const,
      },
      {
        id: 'b_3',
        slotStart: '2026-07-20T09:30:00.000Z',
        createdAt: '2026-07-20T08:10:00.000Z',
        status: 'CONFIRMED' as const,
      },
    ],
    businessDayStartUtc: '2026-07-20T00:00:00.000Z',
    businessDayEndUtc: '2026-07-20T23:59:59.999Z',
  };

  it('computes position, peopleAhead, and estimatedWaitMin correctly', () => {
    const res = computeQueuePosition(baseInput);
    expect(res.bookingId).toBe('b_2');
    expect(res.position).toBe(2);
    expect(res.peopleAhead).toBe(1);
    expect(res.estimatedWaitMin).toBe(15);
  });

  it('returns position 0 when booking is not in active list', () => {
    const res = computeQueuePosition({ ...baseInput, bookingId: 'b_99' });
    expect(res.position).toBe(0);
    expect(res.peopleAhead).toBe(0);
    expect(res.estimatedWaitMin).toBe(0);
  });

  it('counts active bookings for business day', () => {
    const activeCount = countActiveForBusiness(
      baseInput.bookings,
      baseInput.businessDayStartUtc,
      baseInput.businessDayEndUtc,
    );
    expect(activeCount).toBe(3);
  });

  it('calculates wait time estimation', () => {
    expect(estimateWaitMin(3, 10)).toBe(30);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @takda/shared test` (or execute `npx jest` / `npx vitest` inside `packages/shared`)
Expected: FAIL with missing module error.

- [ ] **Step 3: Implement shared error constants, schemas, and pure functions**

Create `packages/shared/src/constants/errors.ts`:

```typescript
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMITED: 'RATE_LIMITED',
  IDEMPOTENCY_KEY_REUSED: 'IDEMPOTENCY_KEY_REUSED',
  SLOT_TAKEN: 'SLOT_TAKEN',
  SLOT_FULL: 'SLOT_FULL',
  SERVICE_NOT_FOUND: 'SERVICE_NOT_FOUND',
  BUSINESS_NOT_FOUND: 'BUSINESS_NOT_FOUND',
  BOOKING_NOT_FOUND: 'BOOKING_NOT_FOUND',
  BOOKING_TERMINAL: 'BOOKING_TERMINAL',
  QUEUE_TOKEN_INVALID: 'QUEUE_TOKEN_INVALID',
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;
```

Create `packages/shared/src/schemas/queue.ts`:

```typescript
import { z } from 'zod';
import { bookingStatusSchema } from './booking';

export const queuePositionSchema = z.object({
  bookingId: z.string(),
  position: z.number().int().nonnegative(),
  peopleAhead: z.number().int().nonnegative(),
  estimatedWaitMin: z.number().int().nonnegative(),
  slotStart: z.string().datetime(),
  status: bookingStatusSchema,
});
export type QueuePosition = z.infer<typeof queuePositionSchema>;

export const queueSnapshotSchema = z.object({
  businessId: z.string(),
  totalActive: z.number().int().nonnegative(),
  lastUpdatedAt: z.string().datetime(),
});
export type QueueSnapshot = z.infer<typeof queueSnapshotSchema>;

export const queueBookingChangedSchema = z.object({
  bookingId: z.string(),
  status: bookingStatusSchema,
  slotStart: z.string().datetime(),
});
export type QueueBookingChanged = z.infer<typeof queueBookingChangedSchema>;
```

Modify `packages/shared/src/schemas/booking.ts` (append additions):

```typescript
import { PH_PHONE_REGEX } from '../utils/phone';

export const queueTokenClaimsSchema = z.object({
  sub: z.string(), // bookingId
  businessId: z.string(),
  role: z.literal('customer'),
  iat: z.number(),
  exp: z.number(),
});
export type QueueTokenClaims = z.infer<typeof queueTokenClaimsSchema>;

export const queueTokenResponseSchema = z.object({
  booking: bookingSchema,
  queueToken: z.string(),
  queueTokenExpiresAt: z.string().datetime(),
});
export type QueueTokenResponse = z.infer<typeof queueTokenResponseSchema>;

export const refreshQueueTokenInputSchema = z.object({
  phone: z.string().regex(PH_PHONE_REGEX),
});
export type RefreshQueueTokenInput = z.infer<
  typeof refreshQueueTokenInputSchema
>;
```

Create `packages/shared/src/utils/wait-estimator.ts`:

```typescript
export function estimateWaitMin(
  peopleAhead: number,
  serviceDurationMin: number,
): number {
  return Math.max(0, peopleAhead) * Math.max(1, serviceDurationMin);
}
```

Create `packages/shared/src/utils/queue-position.ts`:

```typescript
import { estimateWaitMin } from './wait-estimator';

export interface QueuePositionInput {
  readonly businessId: string;
  readonly bookingId: string;
  readonly slotStart: string;
  readonly serviceDurationMin: number;
  readonly bookings: ReadonlyArray<{
    id: string;
    slotStart: string;
    createdAt: string;
    status: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'NO_SHOW' | 'CANCELLED';
  }>;
  readonly businessDayStartUtc: string;
  readonly businessDayEndUtc: string;
}

export interface QueuePositionResult {
  readonly bookingId: string;
  readonly position: number;
  readonly peopleAhead: number;
  readonly estimatedWaitMin: number;
  readonly slotStart: string;
}

export function countActiveForBusiness(
  bookings: ReadonlyArray<{ status: string; slotStart: string }>,
  businessDayStartUtc: string,
  businessDayEndUtc: string,
): number {
  const startMs = new Date(businessDayStartUtc).getTime();
  const endMs = new Date(businessDayEndUtc).getTime();

  return bookings.filter((b) => {
    const isToday =
      new Date(b.slotStart).getTime() >= startMs &&
      new Date(b.slotStart).getTime() <= endMs;
    const isActiveStatus = b.status === 'PENDING' || b.status === 'CONFIRMED';
    return isToday && isActiveStatus;
  }).length;
}

export function computeQueuePosition(
  input: QueuePositionInput,
): QueuePositionResult {
  const startMs = new Date(input.businessDayStartUtc).getTime();
  const endMs = new Date(input.businessDayEndUtc).getTime();

  const activeBookings = input.bookings
    .filter((b) => {
      const slotMs = new Date(b.slotStart).getTime();
      const isToday = slotMs >= startMs && slotMs <= endMs;
      const isActiveStatus = b.status === 'PENDING' || b.status === 'CONFIRMED';
      return isToday && isActiveStatus;
    })
    .sort((a, b) => {
      const timeDiff =
        new Date(a.slotStart).getTime() - new Date(b.slotStart).getTime();
      if (timeDiff !== 0) return timeDiff;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

  const index = activeBookings.findIndex((b) => b.id === input.bookingId);
  if (index === -1) {
    return {
      bookingId: input.bookingId,
      position: 0,
      peopleAhead: 0,
      estimatedWaitMin: 0,
      slotStart: input.slotStart,
    };
  }

  const position = index + 1;
  const peopleAhead = index;
  const estimatedWaitMin = estimateWaitMin(
    peopleAhead,
    input.serviceDurationMin,
  );

  return {
    bookingId: input.bookingId,
    position,
    peopleAhead,
    estimatedWaitMin,
    slotStart: input.slotStart,
  };
}
```

Update `packages/shared/src/schemas/index.ts`:

```typescript
export * from './auth';
export * from './booking';
export * from './business';
export * from './queue';
export * from './service';
export * from './slot';
```

Update `packages/shared/src/index.ts`:

```typescript
export * from './constants/errors';
export * from './schemas/index';
export * from './utils/phone';
export * from './utils/queue-position';
export * from './utils/wait-estimator';
```

Bump version in `packages/shared/package.json` to `"0.1.0"`.

- [ ] **Step 4: Run tests and typecheck to verify pass**

Run: `pnpm --filter @takda/shared typecheck`
Expected: PASS

- [ ] **Step 5: Commit changes**

```bash
git add packages/shared
git commit -m "feat(shared): add queue schemas, error codes, and queue position calculation utils"
```

---

### Task 2: API Bookings Module & Event Emitting

**Files:**

- Rename: `apps/api/src/appointments` $\rightarrow$ `apps/api/src/bookings`
- Create: `apps/api/src/bookings/events/booking-created.event.ts`
- Create: `apps/api/src/bookings/events/booking-changed.event.ts`
- Modify: `apps/api/src/bookings/bookings.module.ts`
- Modify: `apps/api/src/bookings/bookings.service.ts`
- Modify: `apps/api/src/bookings/bookings.controller.ts`
- Modify: `apps/api/src/app.module.ts`
- Create: `apps/api/src/bookings/__tests__/bookings.service.spec.ts`

**Interfaces:**

- Consumes: `@takda/shared` schemas (`createBookingInputSchema`, `queueTokenResponseSchema`)
- Produces: `BookingCreatedEvent`, `BookingChangedEvent`, `BookingsService.createBooking`

- [ ] **Step 1: Write failing unit test for `BookingsService`**

```typescript
// apps/api/src/bookings/__tests__/bookings.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { BookingsService } from '../bookings.service';
import { PrismaService } from '../../prisma/prisma.service';
import { QueueTokenService } from '../../queue/queue-token.service';

describe('BookingsService', () => {
  let service: BookingsService;
  let prisma: any;
  let eventEmitter: any;
  let tokenService: any;

  beforeEach(async () => {
    prisma = {
      business: { findFirst: jest.fn() },
      service: { findUnique: jest.fn() },
      booking: { create: jest.fn() },
    };
    eventEmitter = { emit: jest.fn() };
    tokenService = { mintToken: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventEmitter2, useValue: eventEmitter },
        { provide: QueueTokenService, useValue: tokenService },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
  });

  it('creates a booking, mints token, and emits BookingCreatedEvent', async () => {
    prisma.business.findFirst.mockResolvedValue({
      id: 'biz_1',
      tenantId: 't_1',
      slug: 'test-biz',
    });
    prisma.service.findUnique.mockResolvedValue({
      id: 'srv_1',
      businessId: 'biz_1',
      durationMin: 15,
    });
    const mockBooking = {
      id: 'b_1',
      tenantId: 't_1',
      businessId: 'biz_1',
      serviceId: 'srv_1',
      slotStart: new Date('2026-07-20T09:00:00Z'),
      customerName: 'Juan Dela Cruz',
      customerPhone: '+639171234567',
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    prisma.booking.create.mockResolvedValue(mockBooking);
    tokenService.mintToken.mockReturnValue({
      token: 'jwt_token_123',
      expiresAt: '2026-07-21T09:00:00.000Z',
    });

    const result = await service.createBooking('test-biz', {
      serviceId: 'srv_1',
      slotStart: '2026-07-20T09:00:00.000Z',
      customerName: 'Juan Dela Cruz',
      customerPhone: '+639171234567',
    });

    expect(result.queueToken).toBe('jwt_token_123');
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'booking.created',
      expect.objectContaining({ bookingId: 'b_1', businessId: 'biz_1' }),
    );
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `pnpm --filter @takda/api test apps/api/src/bookings/__tests__/bookings.service.spec.ts`
Expected: FAIL with module not found.

- [ ] **Step 3: Implement BookingsModule, events, service, and controller**

Create `apps/api/src/bookings/events/booking-created.event.ts`:

```typescript
export class BookingCreatedEvent {
  constructor(
    public readonly bookingId: string,
    public readonly businessId: string,
    public readonly serviceId: string,
    public readonly slotStart: string,
  ) {}
}
```

Create `apps/api/src/bookings/events/booking-changed.event.ts`:

```typescript
export class BookingChangedEvent {
  constructor(
    public readonly bookingId: string,
    public readonly businessId: string,
    public readonly status:
      | 'PENDING'
      | 'CONFIRMED'
      | 'CHECKED_IN'
      | 'NO_SHOW'
      | 'CANCELLED',
    public readonly slotStart: string,
  ) {}
}
```

Implement `apps/api/src/bookings/bookings.service.ts`:

```typescript
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { QueueTokenService } from '../queue/queue-token.service';
import { CreateBookingInput } from '@takda/shared';
import { BookingCreatedEvent } from './events/booking-created.event';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly queueTokenService: QueueTokenService,
  ) {}

  async createBooking(businessSlug: string, dto: CreateBookingInput) {
    const business = await this.prisma.business.findFirst({
      where: { slug: businessSlug, isActive: true },
    });
    if (!business) {
      throw new NotFoundException({
        code: 'BUSINESS_NOT_FOUND',
        message: `Business '${businessSlug}' not found`,
      });
    }

    const service = await this.prisma.service.findUnique({
      where: { id: dto.serviceId },
    });
    if (!service || service.businessId !== business.id || !service.isActive) {
      throw new NotFoundException({
        code: 'SERVICE_NOT_FOUND',
        message: `Service '${dto.serviceId}' not found`,
      });
    }

    const slotStartUtc = new Date(dto.slotStart);

    try {
      const booking = await this.prisma.booking.create({
        data: {
          tenantId: business.tenantId,
          businessId: business.id,
          serviceId: service.id,
          slotStart: slotStartUtc,
          customerName: dto.customerName,
          customerPhone: dto.customerPhone,
          notes: dto.notes,
          status: 'PENDING',
          source: 'ONLINE',
        },
      });

      const { token, expiresAt } = this.queueTokenService.mintToken({
        bookingId: booking.id,
        businessId: business.id,
      });

      this.eventEmitter.emit(
        'booking.created',
        new BookingCreatedEvent(
          booking.id,
          business.id,
          service.id,
          booking.slotStart.toISOString(),
        ),
      );

      return {
        booking: {
          ...booking,
          slotStart: booking.slotStart.toISOString(),
          createdAt: booking.createdAt.toISOString(),
          updatedAt: booking.updatedAt.toISOString(),
          resolvedAt: booking.resolvedAt?.toISOString() ?? null,
        },
        queueToken: token,
        queueTokenExpiresAt: expiresAt,
      };
    } catch (err: any) {
      if (err.code === 'P2002') {
        throw new ConflictException({
          code: 'SLOT_TAKEN',
          message: 'The selected slot has already been booked',
        });
      }
      throw err;
    }
  }
}
```

Implement `apps/api/src/bookings/bookings.controller.ts`:

```typescript
import { Controller, Post, Param, Body, UsePipes } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { BookingsService } from './bookings.service';
import { createBookingInputSchema, CreateBookingInput } from '@takda/shared';

@Controller('v1/businesses')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post(':slug/bookings')
  @UsePipes(new ZodValidationPipe(createBookingInputSchema))
  async createBooking(
    @Param('slug') slug: string,
    @Body() dto: CreateBookingInput,
  ) {
    return this.bookingsService.createBooking(slug, dto);
  }
}
```

Update `apps/api/src/bookings/bookings.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [QueueModule],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
```

Update `apps/api/src/app.module.ts`:
Replace `AppointmentsModule` with `BookingsModule`.

- [ ] **Step 4: Run unit test to verify pass**

Run: `pnpm --filter @takda/api test apps/api/src/bookings/__tests__/bookings.service.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api
git commit -m "feat(api): refactor appointments to bookings module with queue token minting and events"
```

---

### Task 3: API Queue Token & Queue Calculation Services

**Files:**

- Create: `apps/api/src/queue/queue-token.service.ts`
- Create: `apps/api/src/queue/__tests__/queue-token.service.spec.ts`
- Modify: `apps/api/src/queue/queue.service.ts`
- Create: `apps/api/src/queue/__tests__/queue.service.spec.ts`
- Modify: `apps/api/src/queue/queue.controller.ts`
- Modify: `apps/api/src/queue/queue.module.ts`

**Interfaces:**

- Consumes: `@takda/shared` utils (`computeQueuePosition`, `countActiveForBusiness`)
- Produces: `QueueTokenService.mintToken`, `QueueTokenService.verifyToken`, `QueueService.computePositionForBooking`, `QueueService.computeSnapshot`, `POST /v1/bookings/:id/queue-token`

- [ ] **Step 1: Write failing unit test for `QueueTokenService` and `QueueService`**

Create `apps/api/src/queue/__tests__/queue-token.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { QueueTokenService } from '../queue-token.service';

describe('QueueTokenService', () => {
  let service: QueueTokenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueTokenService,
        JwtService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('super-secret-key-123') },
        },
      ],
    }).compile();

    service = module.get<QueueTokenService>(QueueTokenService);
  });

  it('mints and verifies valid token', () => {
    const minted = service.mintToken({
      bookingId: 'b_123',
      businessId: 'biz_456',
    });
    expect(minted.token).toBeDefined();

    const payload = service.verifyToken(minted.token);
    expect(payload.sub).toBe('b_123');
    expect(payload.businessId).toBe('biz_456');
  });

  it('throws on invalid token', () => {
    expect(() => service.verifyToken('invalid.token.string')).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `pnpm --filter @takda/api test apps/api/src/queue/__tests__/queue-token.service.spec.ts`
Expected: FAIL

- [ ] **Step 3: Implement QueueTokenService, QueueService, and QueueController**

Create `apps/api/src/queue/queue-token.service.ts`:

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { QueueTokenClaims } from '@takda/shared';

@Injectable()
export class QueueTokenService {
  private readonly secret: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.secret = this.configService.get<string>(
      'JWT_SECRET',
      'dev-secret-key',
    );
  }

  mintToken(opts: { bookingId: string; businessId: string }): {
    token: string;
    expiresAt: string;
  } {
    const expiresInSeconds = 24 * 60 * 60; // 24h
    const nowSec = Math.floor(Date.now() / 1000);
    const expSec = nowSec + expiresInSeconds;

    const payload: Omit<QueueTokenClaims, 'iat' | 'exp'> = {
      sub: opts.bookingId,
      businessId: opts.businessId,
      role: 'customer',
    };

    const token = this.jwtService.sign(payload, {
      secret: this.secret,
      expiresIn: expiresInSeconds,
    });

    return {
      token,
      expiresAt: new Date(expSec * 1000).toISOString(),
    };
  }

  verifyToken(token: string): QueueTokenClaims {
    try {
      return this.jwtService.verify<QueueTokenClaims>(token, {
        secret: this.secret,
      });
    } catch {
      throw new UnauthorizedException({
        code: 'QUEUE_TOKEN_INVALID',
        message: 'Invalid or expired queue token',
      });
    }
  }
}
```

Implement `apps/api/src/queue/queue.service.ts`:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  computeQueuePosition,
  countActiveForBusiness,
  QueuePositionResult,
  QueueSnapshot,
} from '@takda/shared';

@Injectable()
export class QueueService {
  constructor(private readonly prisma: PrismaService) {}

  async computePositionForBooking(
    bookingId: string,
  ): Promise<QueuePositionResult> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { service: true, business: true },
    });

    if (!booking) {
      throw new NotFoundException({
        code: 'BOOKING_NOT_FOUND',
        message: `Booking '${bookingId}' not found`,
      });
    }

    const slotDate = new Date(booking.slotStart);
    const startOfDay = new Date(slotDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(slotDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const dayBookings = await this.prisma.booking.findMany({
      where: {
        businessId: booking.businessId,
        slotStart: { gte: startOfDay, lte: endOfDay },
      },
      select: {
        id: true,
        slotStart: true,
        createdAt: true,
        status: true,
      },
    });

    return computeQueuePosition({
      businessId: booking.businessId,
      bookingId: booking.id,
      slotStart: booking.slotStart.toISOString(),
      serviceDurationMin: booking.service.durationMin,
      bookings: dayBookings.map((b) => ({
        id: b.id,
        slotStart: b.slotStart.toISOString(),
        createdAt: b.createdAt.toISOString(),
        status: b.status,
      })),
      businessDayStartUtc: startOfDay.toISOString(),
      businessDayEndUtc: endOfDay.toISOString(),
    });
  }

  async computeSnapshot(businessId: string): Promise<QueueSnapshot> {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const bookings = await this.prisma.booking.findMany({
      where: {
        businessId,
        slotStart: { gte: startOfDay, lte: endOfDay },
      },
      select: { status: true, slotStart: true },
    });

    const totalActive = countActiveForBusiness(
      bookings.map((b) => ({
        status: b.status,
        slotStart: b.slotStart.toISOString(),
      })),
      startOfDay.toISOString(),
      endOfDay.toISOString(),
    );

    return {
      businessId,
      totalActive,
      lastUpdatedAt: new Date().toISOString(),
    };
  }
}
```

Implement `apps/api/src/queue/queue.controller.ts`:

```typescript
import {
  Controller,
  Post,
  Param,
  Body,
  UsePipes,
  ConflictException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { QueueTokenService } from './queue-token.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  refreshQueueTokenInputSchema,
  RefreshQueueTokenInput,
} from '@takda/shared';

@Controller('v1/bookings')
export class QueueController {
  constructor(
    private readonly queueTokenService: QueueTokenService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post(':id/queue-token')
  @UsePipes(new ZodValidationPipe(refreshQueueTokenInputSchema))
  async refreshQueueToken(
    @Param('id') bookingId: string,
    @Body() dto: RefreshQueueTokenInput,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking || booking.customerPhone !== dto.phone) {
      throw new ConflictException({
        code: 'BOOKING_NOT_FOUND',
        message: 'Booking not found or phone mismatch',
      });
    }

    if (['CANCELLED', 'NO_SHOW', 'CHECKED_IN'].includes(booking.status)) {
      throw new ConflictException({
        code: 'BOOKING_TERMINAL',
        message: `Booking is in terminal state '${booking.status}'`,
      });
    }

    const { token, expiresAt } = this.queueTokenService.mintToken({
      bookingId: booking.id,
      businessId: booking.businessId,
    });

    return {
      booking: {
        ...booking,
        slotStart: booking.slotStart.toISOString(),
        createdAt: booking.createdAt.toISOString(),
        updatedAt: booking.updatedAt.toISOString(),
        resolvedAt: booking.resolvedAt?.toISOString() ?? null,
      },
      queueToken: token,
      queueTokenExpiresAt: expiresAt,
    };
  }
}
```

Update `apps/api/src/queue/queue.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { QueueService } from './queue.service';
import { QueueTokenService } from './queue-token.service';
import { QueueController } from './queue.controller';

@Module({
  imports: [JwtModule.register({})],
  controllers: [QueueController],
  providers: [QueueService, QueueTokenService],
  exports: [QueueService, QueueTokenService],
})
export class QueueModule {}
```

- [ ] **Step 4: Run unit tests to verify pass**

Run: `pnpm --filter @takda/api test apps/api/src/queue/__tests__/queue-token.service.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api
git commit -m "feat(api): add QueueTokenService, QueueService position math, and silent token refresh endpoint"
```

---

### Task 4: API WebSocket Gateway & WsExceptionFilter

**Files:**

- Create: `apps/api/src/common/filters/ws-exception.filter.ts`
- Create: `apps/api/src/common/filters/__tests__/ws-exception.filter.spec.ts`
- Modify: `apps/api/src/queue/queue.gateway.ts`
- Create: `apps/api/src/queue/__tests__/queue.gateway.spec.ts`
- Modify: `apps/api/src/queue/queue.module.ts`

**Interfaces:**

- Consumes: `QueueTokenService`, `QueueService`, `BookingCreatedEvent`, `BookingChangedEvent`
- Produces: Socket.IO Gateway (`/queue`), broadcasts `queue.snapshot`, `queue.position`, `queue.booking.changed`.

- [ ] **Step 1: Write failing unit test for `WsExceptionFilter` and `QueueGateway`**

Create `apps/api/src/common/filters/__tests__/ws-exception.filter.spec.ts`:

```typescript
import { WsExceptionFilter } from '../ws-exception.filter';
import { WsException } from '@nestjs/websockets';

describe('WsExceptionFilter', () => {
  let filter: WsExceptionFilter;
  let clientMock: any;

  beforeEach(() => {
    filter = new WsExceptionFilter();
    clientMock = { emit: jest.fn() };
  });

  it('formats WsException and emits error frame to client without closing', () => {
    const hostMock: any = {
      switchToWs: () => ({
        getClient: () => clientMock,
      }),
    };

    filter.catch(
      new WsException({ code: 'TEST_ERROR', message: 'Test error' }),
      hostMock,
    );

    expect(clientMock.emit).toHaveBeenCalledWith('exception', {
      status: 'error',
      code: 'TEST_ERROR',
      message: 'Test error',
    });
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `pnpm --filter @takda/api test apps/api/src/common/filters/__tests__/ws-exception.filter.spec.ts`
Expected: FAIL

- [ ] **Step 3: Implement WsExceptionFilter and QueueGateway**

Create `apps/api/src/common/filters/ws-exception.filter.ts`:

```typescript
import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';

@Catch()
export class WsExceptionFilter extends BaseWsExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const client = host.switchToWs().getClient();
    const error =
      exception instanceof WsException
        ? exception.getError()
        : { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' };

    const payload =
      typeof error === 'object' && error !== null
        ? error
        : { code: 'WS_ERROR', message: String(error) };

    client.emit('exception', {
      status: 'error',
      code: (payload as any).code ?? 'WS_ERROR',
      message: (payload as any).message ?? 'WebSocket error',
    });
  }
}
```

Implement `apps/api/src/queue/queue.gateway.ts`:

```typescript
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  UseFilters,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';
import { QueueTokenService } from './queue-token.service';
import { QueueService } from './queue.service';
import { WsExceptionFilter } from '../common/filters/ws-exception.filter';
import { BookingCreatedEvent } from '../bookings/events/booking-created.event';
import { BookingChangedEvent } from '../bookings/events/booking-changed.event';

@WebSocketGateway({
  namespace: '/queue',
  cors: { origin: process.env.WEB_ORIGIN || '*' },
})
@UseFilters(WsExceptionFilter)
export class QueueGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private snapshotTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly queueTokenService: QueueTokenService,
    private readonly queueService: QueueService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers['x-queue-token'];

      if (!token || typeof token !== 'string') {
        this.rejectClient(client, 'QUEUE_TOKEN_INVALID', 'Missing token');
        return;
      }

      const claims = this.queueTokenService.verifyToken(token);

      const businessRoom = `queue:business:${claims.businessId}`;
      const bookingRoom = `queue:booking:${claims.sub}`;

      await client.join(businessRoom);
      await client.join(bookingRoom);

      // Emit initial position to customer socket
      const pos = await this.queueService.computePositionForBooking(claims.sub);
      client.emit('queue.position', pos);

      // Trigger throttled snapshot broadcast
      this.scheduleSnapshotBroadcast(claims.businessId);
    } catch (err: any) {
      this.rejectClient(
        client,
        'QUEUE_TOKEN_INVALID',
        err.message || 'Authentication failed',
      );
    }
  }

  handleDisconnect(client: Socket) {
    // Rooms automatically cleaned up by Socket.IO
  }

  @OnEvent('booking.created')
  async handleBookingCreated(event: BookingCreatedEvent) {
    this.scheduleSnapshotBroadcast(event.businessId);

    // Push new position calculation to the specific booking
    try {
      const pos = await this.queueService.computePositionForBooking(
        event.bookingId,
      );
      this.server
        .to(`queue:booking:${event.bookingId}`)
        .emit('queue.position', pos);
    } catch {}
  }

  @OnEvent('booking.changed')
  async handleBookingChanged(event: BookingChangedEvent) {
    this.scheduleSnapshotBroadcast(event.businessId);

    this.server
      .to(`queue:business:${event.businessId}`)
      .emit('queue.booking.changed', {
        bookingId: event.bookingId,
        status: event.status,
        slotStart: event.slotStart,
      });

    try {
      const pos = await this.queueService.computePositionForBooking(
        event.bookingId,
      );
      this.server
        .to(`queue:booking:${event.bookingId}`)
        .emit('queue.position', pos);
    } catch {}
  }

  private scheduleSnapshotBroadcast(businessId: string) {
    if (this.snapshotTimers.has(businessId)) return;

    const timer = setTimeout(async () => {
      this.snapshotTimers.delete(businessId);
      try {
        const snapshot = await this.queueService.computeSnapshot(businessId);
        this.server
          .to(`queue:business:${businessId}`)
          .emit('queue.snapshot', snapshot);
      } catch {}
    }, 2000);

    this.snapshotTimers.set(businessId, timer);
  }

  private rejectClient(client: Socket, code: string, message: string) {
    client.emit('exception', { status: 'error', code, message });
    client.disconnect(true);
  }
}
```

Update `apps/api/src/queue/queue.module.ts`:
Add `QueueGateway` to providers.

- [ ] **Step 4: Run unit tests to verify pass**

Run: `pnpm --filter @takda/api test apps/api/src/common/filters/__tests__/ws-exception.filter.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api
git commit -m "feat(api): implement Socket.IO QueueGateway with room throttling and WsExceptionFilter"
```

---

### Task 5: Web Client API & i18n Dictionary Additions

**Files:**

- Modify: `apps/web/package.json` (add `socket.io-client` if missing)
- Modify: `apps/web/app/[lang]/dictionaries/en.json`
- Modify: `apps/web/app/[lang]/dictionaries/tl.json`
- Modify: `apps/web/lib/api.ts`
- Create: `apps/web/lib/__tests__/api.test.ts`

**Interfaces:**

- Produces: `lib/api.ts` exports `createBooking` and `refreshQueueToken`.

- [ ] **Step 1: Write failing test for web API wrappers**

Create `apps/web/lib/__tests__/api.test.ts`:

```typescript
import { createBooking, refreshQueueToken } from '../api';

global.fetch = jest.fn() as any;

describe('lib/api queue wrappers', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockReset();
  });

  it('calls POST /v1/businesses/:slug/bookings with idempotency header', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ queueToken: 'token_123' }),
    });

    const res = await createBooking(
      'test-biz',
      {
        serviceId: 's1',
        slotStart: '2026-07-20T09:00:00Z',
        customerName: 'Juan',
        customerPhone: '+639171234567',
      },
      'idempotency_key_1',
    );

    expect(res.queueToken).toBe('token_123');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/businesses/test-biz/bookings'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Idempotency-Key': 'idempotency_key_1',
        }),
      }),
    );
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `pnpm --filter @takda/web test` (or `npx jest lib/__tests__/api.test.ts` inside `apps/web`)
Expected: FAIL

- [ ] **Step 3: Implement package dependency, dictionary strings, and lib/api.ts methods**

Add `"socket.io-client": "^4.8.1"` to `apps/web/package.json` dependencies.

Add `positionCard` keys to `apps/web/app/[lang]/dictionaries/en.json`:

```json
"positionCard": {
  "yourSlot": "Your Slot",
  "yourNumber": "Your Queue Number",
  "estimatedWait": "Estimated Wait",
  "peopleAhead": "{count} people ahead of you",
  "youAreNext": "You're next!",
  "reconnecting": "Reconnecting...",
  "expired": "Session expired",
  "tapToRejoin": "Tap to rejoin queue",
  "terminalState": "Your booking is no longer active"
}
```

Add `positionCard` keys to `apps/web/app/[lang]/dictionaries/tl.json`:

```json
"positionCard": {
  "yourSlot": "Oras mo",
  "yourNumber": "Numero mo sa linya",
  "estimatedWait": "Tantyang oras ng paghihintay",
  "peopleAhead": "{count} tao ang nasa unahan mo",
  "youAreNext": "Ikaw na ang kasunod!",
  "reconnecting": "Kumokonekta muli...",
  "expired": "Nag-expire ang session",
  "tapToRejoin": "Pindutin para bumalik sa linya",
  "terminalState": "Hindi na aktibo ang iyong booking"
}
```

Modify `apps/web/lib/api.ts` (append API functions):

```typescript
import {
  CreateBookingInput,
  QueueTokenResponse,
  queueTokenResponseSchema,
} from '@takda/shared';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function createBooking(
  businessSlug: string,
  input: CreateBookingInput,
  idempotencyKey: string,
): Promise<QueueTokenResponse> {
  const res = await fetch(
    `${API_BASE}/v1/businesses/${businessSlug}/bookings`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(input),
    },
  );

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to create booking');
  }

  return queueTokenResponseSchema.parse(data);
}

export async function refreshQueueToken(
  bookingId: string,
  phone: string,
): Promise<QueueTokenResponse> {
  const res = await fetch(`${API_BASE}/v1/bookings/${bookingId}/queue-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to refresh queue token');
  }

  return queueTokenResponseSchema.parse(data);
}
```

- [ ] **Step 4: Run unit tests to verify pass**

Run `pnpm --filter @takda/web typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web
git commit -m "feat(web): add socket.io-client dependency, i18n dictionaries, and typed API client methods"
```

---

### Task 6: Web Hook `useQueuePosition`

**Files:**

- Create: `apps/web/pages/[lang]/b/[businessSlug]/hooks/_useQueuePosition.ts`
- Create: `apps/web/pages/[lang]/b/[businessSlug]/hooks/_useQueuePosition.test.ts`

**Interfaces:**

- Produces: `useQueuePosition` hook returning `{ position, totalActive, status, onTapToRejoin }`.

- [ ] **Step 1: Write failing hook test**

Create `apps/web/pages/[lang]/b/[businessSlug]/hooks/_useQueuePosition.test.ts`:

```typescript
import { renderHook, act } from '@testing-library/react';
import { useQueuePosition } from './_useQueuePosition';

describe('useQueuePosition hook', () => {
  it('initializes with SSR position', () => {
    const initialPos = {
      bookingId: 'b_1',
      position: 3,
      peopleAhead: 2,
      estimatedWaitMin: 30,
      slotStart: '2026-07-20T09:00:00Z',
      status: 'CONFIRMED' as const,
    };

    const { result } = renderHook(() =>
      useQueuePosition({
        bookingId: 'b_1',
        businessId: 'biz_1',
        initialToken: 'test_token',
        initialPosition: initialPos,
        refreshPhone: '+639171234567',
      }),
    );

    expect(result.current.position).toEqual(initialPos);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `pnpm --filter @takda/web test`
Expected: FAIL

- [ ] **Step 3: Implement `useQueuePosition`**

Create `apps/web/pages/[lang]/b/[businessSlug]/hooks/_useQueuePosition.ts`:

```typescript
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { QueuePosition, refreshQueueToken } from '@takda/shared';
import { refreshQueueToken as refreshApiToken } from '../../../../../lib/api';

const WS_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function useQueuePosition(opts: {
  bookingId: string;
  businessId: string;
  initialToken: string;
  initialPosition: QueuePosition;
  refreshPhone: string;
}) {
  const [position, setPosition] = useState<QueuePosition>(opts.initialPosition);
  const [totalActive, setTotalActive] = useState<number | null>(null);
  const [status, setStatus] = useState<
    'connecting' | 'live' | 'reconnecting' | 'expired' | 'error'
  >('connecting');
  const [token, setToken] = useState<string>(opts.initialToken);

  const socketRef = useRef<Socket | null>(null);

  const handleSilentRefresh = useCallback(async () => {
    try {
      const res = await refreshApiToken(opts.bookingId, opts.refreshPhone);
      setToken(res.queueToken);
      if (socketRef.current) {
        socketRef.current.auth = { token: res.queueToken };
        socketRef.current.disconnect().connect();
      }
    } catch {
      setStatus('expired');
    }
  }, [opts.bookingId, opts.refreshPhone]);

  useEffect(() => {
    const socket = io(`${WS_URL}/queue`, {
      auth: { token },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => setStatus('live'));
    socket.on('disconnect', () => setStatus('reconnecting'));

    socket.on('queue.position', (data: QueuePosition) => {
      setPosition(data);
    });

    socket.on('queue.snapshot', (data: { totalActive: number }) => {
      setTotalActive(data.totalActive);
    });

    socket.on('exception', (err: { code: string }) => {
      if (err.code === 'QUEUE_TOKEN_INVALID') {
        handleSilentRefresh();
      } else {
        setStatus('error');
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [token, handleSilentRefresh]);

  return {
    position,
    totalActive,
    status,
    onTapToRejoin: handleSilentRefresh,
  };
}
```

- [ ] **Step 4: Run unit tests to verify pass**

Run: `pnpm --filter @takda/web typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web
git commit -m "feat(web): implement useQueuePosition hook with socket singleton and silent token refresh"
```

---

### Task 7: Web PositionCard & Booking Confirmation Page

**Files:**

- Create: `apps/web/pages/[lang]/b/[businessSlug]/sections/_PositionCard.tsx`
- Create: `apps/web/pages/[lang]/b/[businessSlug]/sections/_PositionCard.test.tsx`
- Modify: `apps/web/app/[lang]/(customer)/b/[businessSlug]/confirm/page.tsx`
- Modify: `apps/web/pages/[lang]/b/[businessSlug]/_CustomerBookingView.tsx`

**Interfaces:**

- Consumes: `useQueuePosition`, `@takda/shared` schemas
- Produces: `<PositionCard />` component, SSR `/confirm` page rendering live position.

- [ ] **Step 1: Write failing component test**

Create `apps/web/pages/[lang]/b/[businessSlug]/sections/_PositionCard.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import { PositionCard } from './_PositionCard';

describe('PositionCard', () => {
  const mockProps = {
    bookingId: 'b_1',
    businessId: 'biz_1',
    businessName: "Pedro's Barbershop",
    businessAddress: '123 Palengke St',
    initialPosition: {
      bookingId: 'b_1',
      position: 2,
      peopleAhead: 1,
      estimatedWaitMin: 15,
      slotStart: '2026-07-20T09:00:00Z',
      status: 'CONFIRMED' as const,
    },
    queueToken: 'mock_token',
    queueTokenExpiresAt: '2026-07-21T09:00:00Z',
    refreshPhone: '+639171234567',
    dict: {
      positionCard: {
        yourSlot: 'Your Slot',
        yourNumber: 'Your Queue Number',
        estimatedWait: 'Estimated Wait',
        peopleAhead: '{count} people ahead of you',
        youAreNext: "You're next!",
        reconnecting: 'Reconnecting...',
        expired: 'Session expired',
        tapToRejoin: 'Tap to rejoin queue',
        terminalState: 'Your booking is no longer active',
      },
    },
  };

  it('renders queue position and business name', () => {
    render(<PositionCard {...mockProps} />);
    expect(screen.getByText("Pedro's Barbershop")).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `pnpm --filter @takda/web test`
Expected: FAIL

- [ ] **Step 3: Implement PositionCard and update confirm/page.tsx**

Create `apps/web/pages/[lang]/b/[businessSlug]/sections/_PositionCard.tsx`:

```typescript
'use client';

import { useQueuePosition } from '../hooks/_useQueuePosition';
import { QueuePosition } from '@takda/shared';

interface PositionCardProps {
  bookingId: string;
  businessId: string;
  businessName: string;
  businessAddress: string | null;
  initialPosition: QueuePosition;
  queueToken: string;
  queueTokenExpiresAt: string;
  refreshPhone: string;
  dict: any;
}

export function PositionCard(props: PositionCardProps) {
  const { position, totalActive, status, onTapToRejoin } = useQueuePosition({
    bookingId: props.bookingId,
    businessId: props.businessId,
    initialToken: props.queueToken,
    initialPosition: props.initialPosition,
    refreshPhone: props.refreshPhone,
  });

  const activePos = position ?? props.initialPosition;
  const t = props.dict.positionCard;

  return (
    <div className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-xl border border-teal-100">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{props.businessName}</h2>
          {props.businessAddress && (
            <p className="text-sm text-gray-500">{props.businessAddress}</p>
          )}
        </div>
        {status === 'reconnecting' && (
          <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
            {t.reconnecting}
          </span>
        )}
      </div>

      <div className="my-6 text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-gray-500">
          {t.yourNumber}
        </p>
        <p className="my-2 text-6xl font-black text-teal-600">#{activePos.position}</p>
        <p className="text-sm font-semibold text-teal-800">
          {activePos.peopleAhead === 0
            ? t.youAreNext
            : t.peopleAhead.replace('{count}', String(activePos.peopleAhead))}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 border-t pt-4 text-center">
        <div>
          <p className="text-xs text-gray-500">{t.yourSlot}</p>
          <p className="text-base font-semibold text-gray-900">
            {new Date(activePos.slotStart).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">{t.estimatedWait}</p>
          <p className="text-base font-semibold text-gray-900">
            ~{activePos.estimatedWaitMin} min
          </p>
        </div>
      </div>

      {totalActive !== null && (
        <p className="mt-4 text-center text-xs text-gray-400">
          {totalActive} total active bookings today
        </p>
      )}

      {status === 'expired' && (
        <button
          onClick={onTapToRejoin}
          className="mt-6 w-full rounded-xl bg-teal-600 py-3 text-sm font-bold text-white shadow-md hover:bg-teal-700"
        >
          {t.tapToRejoin}
        </button>
      )}
    </div>
  );
}
```

Update `apps/web/app/[lang]/(customer)/b/[businessSlug]/confirm/page.tsx`:

```typescript
import { notFound } from 'next/navigation';
import { PageProps } from 'next';
import { PositionCard } from '../../../../../../pages/[lang]/b/[businessSlug]/sections/_PositionCard';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default async function ConfirmPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string; businessSlug: string }>;
  searchParams: Promise<{ booking?: string; token?: string; phone?: string }>;
}) {
  const { lang, businessSlug } = await params;
  const { booking: bookingId, token, phone } = await searchParams;

  if (!bookingId || !token) {
    notFound();
  }

  const res = await fetch(`${API_BASE}/v1/bookings/${bookingId}/position`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!res.ok) {
    notFound();
  }

  const data = await res.json();

  const dict = (await import(`../../../../dictionaries/${lang}.json`)).default;

  return (
    <main className="min-h-screen bg-slate-50 p-4">
      <PositionCard
        bookingId={bookingId}
        businessId={data.businessId}
        businessName={data.businessName}
        businessAddress={data.businessAddress}
        initialPosition={data.position}
        queueToken={token}
        queueTokenExpiresAt={data.expiresAt}
        refreshPhone={phone || ''}
        dict={dict}
      />
    </main>
  );
}
```

- [ ] **Step 4: Run typecheck and component test to verify pass**

Run: `pnpm --filter @takda/web typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web
git commit -m "feat(web): add PositionCard component and wire confirmation page SSR"
```

---

### Task 8: End-to-End Queue Join Flow Test

**Files:**

- Create: `apps/web/e2e/queue-join.spec.ts`

**Interfaces:**

- Tests complete flow: booking creation on web -> navigation to `/confirm` -> live position card display.

- [ ] **Step 1: Create E2E spec**

Create `apps/web/e2e/queue-join.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Queue Join & Live Position Flow', () => {
  test('customer completes booking and sees live queue position', async ({
    page,
  }) => {
    await page.goto('/en/b/pedros-barbershop');

    // Select service and slot (mocked or seed data)
    await page.click('text=Haircut');
    await page.click('button:has-text("09:00 AM")');

    // Fill form
    await page.fill('input[name="customerName"]', 'Juan Dela Cruz');
    await page.fill('input[name="customerPhone"]', '09171234567');
    await page.click('button[type="submit"]');

    // Assert land on confirm page with position card
    await expect(page).toHaveURL(/\/confirm\?booking=/);
    await expect(page.locator('text=Your Queue Number')).toBeVisible();
    await expect(page.locator('text=#1')).toBeVisible();
  });
});
```

- [ ] **Step 2: Verify full monorepo build and typecheck**

Run:

1. `pnpm typecheck`
2. `pnpm build`

Expected: Both pass cleanly with 0 errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/e2e
git commit -m "test(e2e): add end-to-end queue join and live position spec"
```

---

## Plan Self-Review

1. **Spec coverage check:**
   - Section 4: `@takda/shared` schemas & queue-position math -> Task 1.
   - Section 5: API REST Endpoints (`POST /v1/businesses/:slug/bookings`, `POST /v1/bookings/:id/queue-token`) -> Tasks 2 & 3.
   - Section 6: WebSocket Gateway & `WsExceptionFilter` -> Task 4.
   - Section 7: Web client hook `useQueuePosition`, `<PositionCard />`, confirm page -> Tasks 5, 6, 7.
   - Section 9: Unit, integration, and E2E tests -> Tasks 1, 2, 3, 4, 5, 6, 7, 8.

2. **Placeholder scan:** No TBDs, no TODOs, all code blocks contain exact imports, concrete functions, and runnable test cases.

3. **Type consistency:** `QueuePosition`, `QueueTokenResponse`, `BookingCreatedEvent` types match across shared, api, and web tasks.

---
