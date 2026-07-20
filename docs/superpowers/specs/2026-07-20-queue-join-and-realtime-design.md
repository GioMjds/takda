# Queue Join & Real-Time Position — Design

**Date:** 2026-07-20
**Status:** Approved (pre-implementation)
**Scope:** MVP feature — customer queue join flow + real-time position updates

## 1. Summary

This feature turns the existing `/b/:slug` customer page into a live queue
experience. After a customer books a slot, they see a position card that
updates in real time as the business serves the day. The owner dashboard
already renders the business queue; this feature adds the customer-facing
half of the same real-time channel.

The decision to ship: **hybrid model** — keep the existing slot-picker
booking flow, add a live position card on top. Per-booking position
semantics. Confirmed-bookings-only counting. Silent token refresh on
reconnect. Socket.IO over `@nestjs/websockets`.

## 2. Goals & Non-Goals

### Goals

- A customer who scans a QR code and books a slot sees their position
  update in real time without polling or page refreshes.
- The owner dashboard's existing `QueueGateway` consumer gets the new
  events with zero changes to its rendering code.
- Reconnect (network blip, browser tab restored from background) is
  invisible to the customer; the only failure mode is a single "Tap to
  rejoin" button in the rare case the queue token and silent refresh
  both fail.
- Wire contract change is additive only — no existing field renames,
  removals, or type changes. Bumps the `@takda/shared` version
  non-breakingly; both apps update in the same PR per
  [AGENTS.md §3](../../AGENTS.md#3).

### Non-Goals (out of scope for v1)

- SMS confirmations and reminders (separate feature — `Reminders` module).
- Walk-in ticket model with no slot picker.
- Rolling-average wait time estimator (we ship a `WaitEstimator` interface
  with a simple `peopleAhead × serviceDurationMin` implementation).
- Owner-side analytics, no-show counters, throughput charts.
- Per-customer socket-level rate limits (the global `@nestjs/throttler` is
  enough for v1).
- Multi-tenant scoping on the gateway (v1 is single-tenant).
- Adaptive broadcast throttling (fixed 2s debounce is sufficient).

## 3. Architecture

```diagram
┌────────────────────────────────────────────────────────────────────────┐
│  Browser (Customer PWA)                                                │
│  ┌──────────────────┐  ┌────────────────────┐  ┌──────────────────┐  │
│  │  /b/:slug page   │  │  PositionCard      │  │  socket.io-client │  │
│  │  (slot picker)   │  │  (after booking)   │  │  (singleton)     │  │
│  └────────┬─────────┘  └─────────┬──────────┘  └─────────┬─────────┘  │
│           │ POST /bookings       │ subscribes            │ ws://...   │
└───────────┼─────────────────────┼───────────────────────┼────────────┘
            │                     │                       │
            ▼                     ▼                       ▼
┌───────────────────────────────────────────────────────────────────────┐
│  NestJS API (@takda/api)                                              │
│  ┌──────────────────┐    ┌──────────────────┐    ┌────────────────┐  │
│  │  BookingsModule  │───▶│  EventBus        │───▶│  QueueModule   │  │
│  │  (POST /bookings │    │  BookingCreated  │    │  QueueGateway  │  │
│  │   mints token)   │    │  BookingChanged  │    │  QueueService  │  │
│  └────────┬─────────┘    └──────────────────┘    └────────┬───────┘  │
│           │                                                │          │
│           ▼                                                ▼          │
│  ┌──────────────────┐                            ┌──────────────────┐ │
│  │  PrismaService   │◀───────────────────────────│  PrismaService   │ │
│  └──────────────────┘                            └──────────────────┘ │
└───────────────────────────────────────────────────────────────────────┘
            │                                                ▲
            ▼                                                │
┌───────────────────────────────────────────────────────────────────────┐
│  Postgres   bookings  audit_logs  idempotency_keys                    │
└───────────────────────────────────────────────────────────────────────┘
```

**Three moving parts:**

- **`BookingsModule` (apps/api)** — owns booking creation, mints the
  `queueToken` in the same response, emits `BookingCreatedEvent`.
- **`QueueModule` (apps/api)** — owns position math, the gateway, the
  token mint/verify. Subscribes to booking events and broadcasts to the
  right rooms. Does not create bookings.
- **`PositionCard` + `useQueuePosition` (apps/web)** — owns the socket
  lifecycle on the customer side. Reconnects silently.

The two API modules talk through `EventBus` (`@nestjs/event-emitter`,
already wired in `app.module.ts`). No cross-module service injection on
the hot path.

## 4. Wire Contract Additions (`@takda/shared`)

All additions are non-breaking. The booking endpoint response shape grows
by adding `queueToken` and `queueTokenExpiresAt`; existing consumers
ignoring the new fields are unaffected.

### 4.1 New schemas in `packages/shared/src/schemas/queue.ts`

```typescript
export const queuePositionSchema = z.object({
  bookingId: z.string(),
  position: z.number().int().nonnegative(),
  peopleAhead: z.number().int().nonnegative(),
  estimatedWaitMin: z.number().int().nonnegative(),
  slotStart: z.string().datetime(),
  status: bookingStatusSchema,
});

export const queueSnapshotSchema = z.object({
  businessId: z.string(),
  totalActive: z.number().int().nonnegative(),
  lastUpdatedAt: z.string().datetime(),
});

export const queueBookingChangedSchema = z.object({
  bookingId: z.string(),
  status: bookingStatusSchema,
  slotStart: z.string().datetime(),
});
```

### 4.2 Additions to `packages/shared/src/schemas/booking.ts`

```typescript
export const queueTokenClaimsSchema = z.object({
  sub: z.string(), // bookingId
  businessId: z.string(),
  role: z.literal('customer'),
  iat: z.number(),
  exp: z.number(),
});

export const queueTokenResponseSchema = z.object({
  booking: bookingSchema,
  queueToken: z.string(),
  queueTokenExpiresAt: z.string().datetime(),
});

export const refreshQueueTokenInputSchema = z.object({
  phone: z.string().regex(PH_PHONE_REGEX),
});
```

### 4.3 New error codes in `packages/shared/src/constants/errors.ts`

```typescript
SERVICE_NOT_FOUND:    'SERVICE_NOT_FOUND',
BUSINESS_NOT_FOUND:   'BUSINESS_NOT_FOUND',
BOOKING_NOT_FOUND:    'BOOKING_NOT_FOUND',
BOOKING_TERMINAL:     'BOOKING_TERMINAL',
QUEUE_TOKEN_INVALID:  'QUEUE_TOKEN_INVALID',
```

Existing `SLOT_TAKEN` and `SLOT_FULL` are reused (already defined in
`createBookingInputSchema` validation chain).

### 4.4 New utilities in `packages/shared/src/utils/`

**`queue-position.ts`** (pure functions, no I/O):

```typescript
export interface QueuePositionInput {
  readonly businessId: string;
  readonly bookingId: string;
  readonly slotStart: string;
  readonly serviceDurationMin: number;
  readonly bookings: ReadonlyArray<{
    id: string;
    slotStart: string;
    createdAt: string;
    status: 'PENDING' | 'CONFIRMED';
  }>;
  readonly businessDayStartUtc: string;
  readonly businessDayEndUtc: string;
}

export interface QueuePosition {
  readonly bookingId: string;
  readonly position: number; // 0 = booking not found in active set
  readonly peopleAhead: number;
  readonly estimatedWaitMin: number;
  readonly slotStart: string;
}

export function computeQueuePosition(input: QueuePositionInput): QueuePosition;
export function countActiveForBusiness(
  bookings: ReadonlyArray<{ status: BookingStatus; slotStart: string }>,
  businessDayStartUtc: string,
  businessDayEndUtc: string,
): number;
```

**Algorithm for `computeQueuePosition`:**

1. Filter `bookings` to `status IN (PENDING, CONFIRMED) AND slotStart in
today's business window`.
2. Sort by `(slotStart asc, createdAt asc)`.
3. Find the input `bookingId` in the sorted list. Its 0-based index is
   `position - 1`. If not found, return `position: 0`.
4. `peopleAhead = position - 1`.
5. `estimatedWaitMin = peopleAhead * serviceDurationMin`.

**`wait-estimator.ts`** — the v1 `WaitEstimator` implementation. Single
function exported; v2 swaps the implementation behind the same import.

```typescript
export function estimateWaitMin(
  peopleAhead: number,
  serviceDurationMin: number,
): number;
```

## 5. API Endpoints

### 5.1 `POST /v1/businesses/:slug/bookings`

- `@Public()`, `@Throttle({ default: { limit: 5, ttl: 60_000 } })`.
- **Requires** `Idempotency-Key` header.
- Body: `createBookingInputSchema` (existing).
- Returns 200 with `queueTokenResponseSchema`.
- Errors: 400 `VALIDATION_ERROR`, 404 `BUSINESS_NOT_FOUND` or
  `SERVICE_NOT_FOUND`, 409 `SLOT_TAKEN` / `SLOT_FULL`, 429
  `RATE_LIMITED`, 500 with `correlationId`.
- Side effects: emits `BookingCreatedEvent` via `EventBus`.

### 5.2 `POST /v1/bookings/:id/queue-token`

- `@Public()`, `@Throttle({ default: { limit: 10, ttl: 60_000 } })` per
  booking id.
- Body: `refreshQueueTokenInputSchema` (`{ phone }`).
- Returns 200 with `queueTokenResponseSchema` (booking + new token).
- Errors: 400 `VALIDATION_ERROR`, 404 `BOOKING_NOT_FOUND`, 409
  `BOOKING_TERMINAL` (booking is `CANCELLED` / `NO_SHOW` /
  `CHECKED_IN`), 429 `RATE_LIMITED`.

### 5.3 (No new public endpoint) WebSocket gateway

`/queue` namespace, no REST surface.

## 6. WebSocket Gateway

### 6.1 Configuration

```typescript
@WebSocketGateway({ namespace: '/queue', cors: { origin: ENV.WEB_ORIGIN } })
@UseFilters(WsExceptionFilter)
```

- **No `WsJwtGuard`.** Customer auth is per-message via
  `auth.token = queueToken` on the handshake.
- **Owner auth** (already wired by the owner dashboard) uses a separate
  gateway connection authenticated with the owner JWT — that path is
  unchanged and is not part of this design.

### 6.2 Handshake

1. Customer connects to `/queue` with `auth: { token: queueToken }`.
2. `QueueGateway.handleConnection` calls `QueueTokenService.verify(token)`.
3. On failure → close with `1008`, send one error frame
   `{ status: 'error', code: 'QUEUE_TOKEN_INVALID', message: '...' }`.
4. On success → join `queue:business:{businessId}` and
   `queue:booking:{bookingId}`; emit `queue.snapshot` to the business
   room and `queue.position` to the booking room.

### 6.3 Rooms

| Room                          | Members                                                            | Receives                                  |
| ----------------------------- | ------------------------------------------------------------------ | ----------------------------------------- |
| `queue:business:{businessId}` | All sockets at business                                            | `queue.snapshot`, `queue.booking.changed` |
| `queue:booking:{bookingId}`   | Just the customer (and any owner who explicitly joins — not in v1) | `queue.position`                          |

### 6.4 Events

| Event                   | Direction | Room               | Payload                              | Trigger                                                   |
| ----------------------- | --------- | ------------------ | ------------------------------------ | --------------------------------------------------------- |
| `queue.snapshot`        | S → C     | `queue:business:*` | `queueSnapshotSchema`                | Booking created/changed, throttled to one per 2s per room |
| `queue.position`        | S → C     | `queue:booking:*`  | `queuePositionSchema`                | Any change to this booking's position; not throttled      |
| `queue.booking.changed` | S → C     | `queue:business:*` | `queueBookingChangedSchema` (no PII) | Booking status changed; sent to owner dashboard           |

**Client → server:** none. The customer does not push anything over the
socket. Status changes come from the owner dashboard via REST, not from
the customer's socket.

### 6.5 Throttling

`queue.snapshot` is coalesced per room via `setTimeout(2000ms)`. Multiple
`BookingCreatedEvent` in 2s produce one `queue.snapshot`. `queue.position`
is targeted and not throttled.

### 6.6 Disconnect

`handleDisconnect` cleans up the socket's room memberships. No broadcast
on disconnect. The customer's silent token refresh runs entirely on the
HTTP side.

### 6.7 WsExceptionFilter

New file: `apps/api/src/common/filters/ws-exception.filter.ts`. Catches
exceptions inside WebSocket handlers, emits
`{ status: 'error', code, message }` to the originating socket, and does
**not** drop the connection. Bad handshake tokens are handled separately
in `handleConnection` (close with `1008`).

## 7. Web Side

### 7.1 Page structure

**`app/[lang]/(customer)/b/[businessSlug]/page.tsx`** (modify existing):

- Already a Server Component. No structural change.
- Validates `businessSlug` with `businessSlugSchema`; on failure,
  `notFound()`.
- Fetches business + services + today's slots via `lib/api.ts` (already
  does this; the mock fallback is removed once the API is wired in).
- Renders `<CustomerBookingView />` (existing client component).
- **No socket on this page.** The socket only attaches after a successful
  booking, on the position card.

**`app/[lang]/(customer)/b/[businessSlug]/confirm/page.tsx`** (modify
existing, currently a static "#5" placeholder):

- Server Component.
- Reads `?booking=<id>&token=<queueToken>` from the search params (passed
  by the booking form on success).
- Validates the JWT server-side using `JWT_SECRET` (calls
  `QueueTokenService.verify`). If invalid, `notFound()`.
- Computes the initial position via `computeQueuePosition(...)` — one DB
  round trip, server-side.
- Renders `<PositionCard />` (new client component).

### 7.2 New client component: `<PositionCard />`

Location: `apps/web/pages/[lang]/b/[businessSlug]/sections/_PositionCard.tsx`
(mirrors the existing pattern).

```typescript
interface PositionCardProps {
  bookingId: string;
  businessId: string;
  businessName: string;
  businessAddress: string | null;
  initialPosition: QueuePosition;
  queueToken: string;
  queueTokenExpiresAt: string;
  refreshPhone: string; // full E.164 phone, for silent refresh
  lang: Locale;
  dict: Record<string, unknown>;
}
```

Behavior:

1. Mounts with `initialPosition` from SSR — no flash, no skeleton.
2. Calls `useQueuePosition(...)` (below) to subscribe to the socket.
3. Renders three things: **your slot** (e.g. "8:30 AM"), **your number**
   (e.g. "#5"), **estimated wait** (e.g. "~75 min" or "You're next").
4. Renders a small "12 people in line" subtext from `queue.snapshot`.
5. On `status === 'reconnecting'`, shows a non-scary "Reconnecting…" pill;
   card still shows last position.
6. On `status === 'expired'`, shows a "Tap to rejoin" button that
   re-submits the phone through the silent refresh flow.

### 7.3 New hook: `useQueuePosition`

Location: `apps/web/pages/[lang]/b/[businessSlug]/hooks/_useQueuePosition.ts`.

```typescript
export function useQueuePosition(opts: {
  bookingId: string;
  businessId: string;
  initialToken: string;
  initialPosition: QueuePosition;
  refreshPhone: string;
}): {
  position: QueuePosition | null;
  totalActive: number | null;
  status: 'connecting' | 'live' | 'reconnecting' | 'expired' | 'error';
};
```

**Singleton socket:** A module-level `socket.io-client` connection is
cached per `(businessId, bookingId)` tuple. Multiple component instances
(if any) share it. On the last unmount, the socket disconnects after a 5s
grace period.

**Silent refresh flow:**

1. A `setTimeout` fires 60s before `queueTokenExpiresAt`.
2. Calls `POST /v1/bookings/:id/queue-token` with `{ phone: refreshPhone }`.
3. On 200, swaps the cached token, reconnects socket with
   `auth.token = newToken`.
4. On 401, transitions to `status: 'expired'`, exposes
   `onTapToRejoin` callback for the card to render.

### 7.4 i18n

All strings go in `apps/web/app/[lang]/dictionaries/{en,tl}.json` under a
new `positionCard` key. Tagalog first. The dictionaries already support
nested keys; this is a content-only change.

### 7.5 `lib/api.ts` additions

Two new typed wrappers:

```typescript
export function createBooking(
  input: CreateBookingInput,
  idempotencyKey: string,
): Promise<QueueTokenResponse>;
export function refreshQueueToken(
  bookingId: string,
  phone: string,
): Promise<QueueTokenResponse>;
```

Both throw on non-2xx with the standard `{ code, message, details? }`
shape. The existing wrapper handles the rest.

## 8. Error Handling

| Failure                          | UX                                                             |
| -------------------------------- | -------------------------------------------------------------- |
| Socket disconnects               | Pill says "Reconnecting…", card still shows last position      |
| Token expires                    | Silent refresh; if that fails, "Tap to rejoin"                 |
| `SLOT_TAKEN` on POST             | Booking form shows the error; no position card is rendered     |
| `BOOKING_TERMINAL`               | Position card shows "Your booking is no longer active"         |
| `QUEUE_TOKEN_INVALID` on connect | Confirm page returns 404 via `notFound()`                      |
| `BOOKING_NOT_FOUND` on refresh   | Position card shows "Tap to rejoin"                            |
| `RATE_LIMITED` on POST           | Booking form shows a friendly "Too many attempts" message      |
| Socket error in handler          | `WsExceptionFilter` emits structured error frame; socket stays |

## 9. Testing

### 9.1 Unit (jest, `*.spec.ts`, `apps/api`)

- `QueueService.computePositionForBooking` — pure math. Position=1 when
  alone; position=3 with two earlier bookings; position stable across
  re-runs; unaffected by `CHECKED_IN` after the booking; unaffected by
  bookings from other businesses; unaffected by `CANCELLED` bookings.
- `QueueService.computeSnapshot` — counts only PENDING+CONFIRMED, today
  only.
- `QueueTokenService.mint` / `verify` — round trip, expiry enforced,
  wrong-secret rejected.
- `BookingsService.create` — happy path, `SLOT_TAKEN`, `SLOT_FULL`,
  idempotent replay returns same body, `BUSINESS_NOT_FOUND`,
  `SERVICE_NOT_FOUND`.

### 9.2 Gateway integration (jest, `Test.createTestingModule`)

- `QueueGateway.handleConnection` — invalid token → close; valid token →
  joins both rooms; emits initial `queue.position` and `queue.snapshot`
  (throttled).
- `QueueGateway` listener for `BookingCreatedEvent` — broadcasts to
  correct room; throttles within 2s.
- `WsExceptionFilter` — error frame shape.

### 9.3 Web (vitest or jest, whichever the app already has — check

`apps/web/package.json` first)

- `useQueuePosition` — initial state from props; applies incoming
  `queue.position`; transitions to `reconnecting` on disconnect; silent
  refresh on near-expiry.
- `<PositionCard />` — renders initial position; updates on socket
  event; shows "Reconnecting…" pill; renders "Tap to rejoin" on
  `expired`.

### 9.4 E2E (Playwright at repo root or `apps/web/e2e/`)

- One happy-path spec: open `/b/pedros-barbershop`, pick a service, pick
  a slot, fill name+phone, submit, land on confirm page, position card
  shows, open a second browser as a phantom customer, position
  decrements in real time on the first customer's screen.

## 10. Definition of Done

A change is "done" only when **all** of these are true:

1. `pnpm typecheck` at the root passes.
2. `pnpm lint` for `apps/api`, `apps/web`, and `packages/shared` passes.
3. `pnpm test` at the root passes (including new unit and integration
   tests).
4. The E2E happy-path spec passes against a real Postgres test container.
5. `@takda/shared` version is bumped; PR body contains a "Wire
   contract: added" line listing the new schemas and utilities.
6. Both `apps/web` and `apps/api` are updated in the same PR.
7. No new top-level dependency is added. The only new dependency allowed
   is `socket.io-client` in `apps/web/package.json` (socket.io server
   is already present via `@nestjs/platform-socket.io`).
8. No internal stack traces or PII in any error response or socket
   frame.

## 11. Files Touched (estimate)

**New files:**

- `packages/shared/src/schemas/queue.ts`
- `packages/shared/src/utils/queue-position.ts`
- `packages/shared/src/utils/wait-estimator.ts`
- `apps/api/src/queue/queue.service.ts` (currently a stub)
- `apps/api/src/queue/queue.gateway.ts` (currently a stub)
- `apps/api/src/queue/queue-token.service.ts`
- `apps/api/src/queue/queue.controller.ts` (currently a stub)
- `apps/api/src/common/filters/ws-exception.filter.ts`
- `apps/api/src/queue/__tests__/queue.service.spec.ts`
- `apps/api/src/queue/__tests__/queue.gateway.spec.ts`
- `apps/api/src/queue/__tests__/queue-token.service.spec.ts`
- `apps/web/pages/[lang]/b/[businessSlug]/sections/_PositionCard.tsx`
- `apps/web/pages/[lang]/b/[businessSlug]/hooks/_useQueuePosition.ts`
- `apps/web/pages/[lang]/b/[businessSlug]/sections/_PositionCard.test.tsx`
- `apps/web/pages/[lang]/b/[businessSlug]/hooks/_useQueuePosition.test.ts`
- `e2e/queue-join.spec.ts` (or `apps/web/e2e/queue-join.spec.ts`)

**Modified files:**

- `packages/shared/src/schemas/booking.ts` (add token schemas)
- `packages/shared/src/schemas/index.ts` (re-export queue schemas)
- `packages/shared/src/constants/errors.ts` (add new error codes)
- `packages/shared/src/index.ts` (re-export new utils)
- `apps/api/src/queue/queue.module.ts` (register new providers)
- `apps/api/src/appointments/appointments.module.ts` (rename to
  `bookings/`, add BookingsService + controller — this is a small
  rename + fill-in, not a new module)
- `apps/api/src/appointments/appointments.controller.ts` (renamed)
- `apps/api/src/appointments/appointments.service.ts` (renamed, filled in)
- `apps/api/src/app.module.ts` (replace `AppointmentsModule` import with
  the renamed one)
- `apps/web/app/[lang]/(customer)/b/[businessSlug]/confirm/page.tsx`
  (replace static placeholder with SSR + PositionCard)
- `apps/web/pages/[lang]/b/[businessSlug]/_CustomerBookingView.tsx`
  (pass `queueToken` from response into navigation to confirm page)
- `apps/web/lib/api.ts` (add `createBooking` and `refreshQueueToken`)
- `apps/web/app/[lang]/dictionaries/en.json` and `tl.json` (add
  `positionCard` keys)
- `apps/web/package.json` (add `socket.io-client` if not present)
