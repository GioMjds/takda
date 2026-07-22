# Takda API Endpoints — Bucketlist

> Working roadmap of every REST / WebSocket endpoint the Takda API
> should expose. Marks what's already shipped vs. what's still owed.
> Backed by the root [AGENTS.md](./AGENTS.md) and
> [apps/api/AGENTS.md](./apps/api/AGENTS.md) (domain language,
> layering, Zod-only validation rules, idempotency, real-time contract).
>
> Source of truth for the data shapes is `packages/shared`; the
> source of truth for storage is `apps/api/prisma/schema.prisma`.

## Legend

- ✅ **Shipped** — already implemented and exposed by a controller.
- 🟡 **Partial** — wired but only a stub / one method of a larger surface.
- ⬜ **Pending** — needs a new module / controller / endpoint.
- 🔒 **Auth** — `JwtAuthGuard` (default).
- 🌐 **Public** — `@Public()` (no token required).
- 👑 **Owner-only** — `OWNER` / `ADMIN` `UserRole`.
- 🛡️ **Tenant-scoped** — every read/write must filter by `tenantId` resolved from subdomain or `X-Tenant-Id`.
- ♻️ **Idempotent** — `Idempotency-Key` header required (writes that create money-moving rows or schedule jobs).
- ⏱ **Throttled** — `@nestjs/throttler` limit applied.

---

## 1. Current state of the API (what's wired up)

| Module          | Endpoints                                                                                                                                                                                  | Status                                                    |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| `auth`          | `POST /v1/auth/signup`, `POST /v1/auth/login`, `POST /v1/auth/otp/request`, `POST /v1/auth/otp/verify`, `POST /v1/auth/refresh`, `POST /v1/auth/logout`, `GET /v1/auth/me`                 | ✅                                                        |
| `bookings`      | `POST /v1/businesses/:slug/bookings`                                                                                                                                                       | ✅ (create only — no customer read/update)                |
| `queue-public`  | `POST /v1/bookings/:id/queue-token`, `GET /v1/bookings/:id/position`                                                                                                                       | ✅                                                        |
| `queue-admin`   | `POST walk-ins`, `POST next`, `POST :id/complete`, `POST :id/recall`, `POST :id/skip`, `POST :id/cancel`, `POST :id/priority`, `POST :id/transfer`, `GET /`, `GET services`, `GET history` | ✅ (issue #5 — Queue Management — done)                   |
| `notifications` | _(empty controller placeholder)_                                                                                                                                                           | 🟡                                                        |
| `tenants`       | —                                                                                                                                                                                          | ⬜                                                        |
| `businesses`    | —                                                                                                                                                                                          | ⬜ (files deleted in current diff — needs to be re-added) |
| `services`      | —                                                                                                                                                                                          | ⬜                                                        |
| `slots`         | —                                                                                                                                                                                          | ⬜                                                        |
| `reminders`     | —                                                                                                                                                                                          | ⬜                                                        |
| `webhooks`      | —                                                                                                                                                                                          | ⬜                                                        |
| `health`        | —                                                                                                                                                                                          | ⬜                                                        |
| `email`         | —                                                                                                                                                                                          | ⬜                                                        |

> The Queue Management issue (#5) is satisfied end-to-end: ticket
> numbering, walk-in, next/recall/skip/transfer/cancel, complete,
> priority, live queue, history, public position token. The remainder
> of the v1 product is what follows.

---

## 2. Cross-cutting endpoints (foundation)

These come first because every other module depends on them.

### Health & ops

- [ ] `GET /health` 🌐 — liveness probe (process up).
- [ ] `GET /ready` 🌐 — readiness (Postgres + Redis pings).
- [ ] `GET /metrics` 🌐 — Prometheus scrape (`@willsoto/nestjs-prometheus`).

### Tenants

> v1 is single-tenant per deployment, but the model exists and
> tenant resolution must work for the dev multi-tenant case (header).

- [ ] `GET /v1/tenants/current` 🔒🛡️ — return the tenant resolved from subdomain / `X-Tenant-Id`.
- [ ] `PATCH /v1/tenants/current` 👑🛡️♻️ — update tenant name / settings.
- [ ] `GET /v1/tenants/current/usage` 👑🛡️ — counts of businesses, users, bookings this month (for the future billing surface — read-only for v1).

### Audit log

- [ ] `GET /v1/audit-logs` 👑🛡️ — paginated audit events (`AuditLog`), filterable by `event`, `subjectType`, `actorId`, `from`/`to`.

---

## 3. Businesses (multi-business per tenant)

> The `businesses/` directory was deleted in the current diff and needs
> to come back. This is the central entity — every booking, slot, and
> queue hangs off a `Business`.

### Public discovery (customer PWA / QR landing)

- [ ] `GET /v1/businesses/:slug` 🌐 — public business profile (name, address, timezone, hours, services summary, open/closed now, today's capacity).
- [ ] `GET /v1/businesses/:slug/services` 🌐 — list active services (for slot picking on the QR landing page).

### Owner CRUD

- [ ] `POST /v1/businesses` 👑🛡️♻️ — create a new business (the "register your stall" onboarding step).
- [ ] `GET /v1/businesses` 🔒🛡️ — list businesses the caller is a member of.
- [ ] `GET /v1/businesses/:id` 🔒🛡️ — owner-side full business record (includes inactive services, staff list, settings).
- [ ] `PATCH /v1/businesses/:id` 👑🛡️♻️ — update name, address, phone, timezone, isActive.
- [ ] `DELETE /v1/businesses/:id` 👑🛡️ — soft-delete (set `isActive = false`; never hard-delete — bookings reference this row).
- [ ] `POST /v1/businesses/:id/qr` 🌐 — return a freshly minted signed QR code (PNG / SVG) for the storefront.

### Membership / staff

- [ ] `GET /v1/businesses/:id/members` 👑🛡️ — list staff (join `Membership` + `User`).
- [ ] `POST /v1/businesses/:id/members` 👑🛡️♻️ — invite a staff user by email; creates `Membership`.
- [ ] `PATCH /v1/businesses/:id/members/:userId` 👑🛡️♻️ — change role (`OWNER` / `MANAGER` / `STAFF`).
- [ ] `DELETE /v1/businesses/:id/members/:userId` 👑🛡️ — revoke membership.

### Day overrides

- [ ] `GET /v1/businesses/:id/day-overrides?from=&to=` 🔒🛡️ — list holidays / special hours in a date range.
- [ ] `PUT /v1/businesses/:id/day-overrides/:date` 👑🛡️♻️ — upsert override (closed / custom hours / capacity cap / note).
- [ ] `DELETE /v1/businesses/:id/day-overrides/:date` 👑🛡️ — clear override for a day.

---

## 4. Services (the bookable thing)

- [ ] `GET /v1/businesses/:businessId/services` 🔒🛡️ — owner view (all, including inactive).
- [ ] `POST /v1/businesses/:businessId/services` 👑🛡️♻️ — create service.
- [ ] `GET /v1/businesses/:businessId/services/:id` 🔒🛡️ — single service.
- [ ] `PATCH /v1/businesses/:businessId/services/:id` 👑🛡️♻️ — update name, duration, capacity, hours, daysOfWeekMask, isActive.
- [ ] `DELETE /v1/businesses/:businessId/services/:id` 👑🛡️ — soft-delete (`isActive = false`).
- [ ] `POST /v1/businesses/:businessId/services/reorder` 👑🛡️ — change display order (services show on the QR landing in a fixed sequence).

---

## 5. Slots (capacity & availability)

> Per AGENTS.md §9: capacity is **derived** from `Service` + `DayOverride`,
> materialized on demand and cached in Redis. These endpoints expose that
> view to the customer PWA and the owner dashboard.

### Public availability (QR landing)

- [ ] `GET /v1/businesses/:slug/services/:serviceId/slots?date=YYYY-MM-DD` 🌐⏱ — list available `slotStart` timestamps for that service on that business-local day. Returns `[{ slotStart, remaining }]`. Honors `dailyCapacity`, `capacityPerSlot`, `openTime`/`closeTime`, `daysOfWeekMask`, and `DayOverride`.
- [ ] `GET /v1/businesses/:slug/slots?date=YYYY-MM-DD` 🌐⏱ — all services × slots for the day (the customer "pick your slot" UI).

### Owner capacity view

- [ ] `GET /v1/businesses/:businessId/capacity?date=YYYY-MM-DD` 🔒🛡️ — per-service remaining capacity for the day.
- [ ] `GET /v1/businesses/:businessId/calendar?from=&to=` 🔒🛡️ — 14-day rolling availability grid (dashboard widget).

---

## 6. Bookings (the core domain)

> The `POST /businesses/:slug/bookings` create path exists. The
> rest of the customer + owner read/update surface still needs to be
> wired.

### Customer (own booking)

- [ ] `GET /v1/bookings/:id` 🌐⏱ — fetch booking by id **+** phone / queue-token (proves ownership without an account). Used by the confirmation page.
- [ ] `PATCH /v1/bookings/:id` 🌐♻️ — customer self-edit (rename, change notes). Not allowed once `status >= SERVING`.
- [ ] `POST /v1/bookings/:id/cancel` 🌐♻️ — customer self-cancel; requires phone or queue-token; only `PENDING` / `CONFIRMED`. Sets `cancelledBy = CUSTOMER`.
- [ ] `POST /v1/bookings/:id/reschedule` 🌐♻️ — change `slotStart` to a new available slot; releases old slot under the same transaction.

### Owner (all bookings for a business)

- [ ] `GET /v1/businesses/:businessId/bookings` 🔒🛡️ — list, filter by `status`, `date`, `serviceId`, `q` (name/phone search), paginated. Source for the dashboard table.
- [ ] `GET /v1/businesses/:businessId/bookings/:id` 🔒🛡️ — single booking detail.
- [ ] `PATCH /v1/businesses/:businessId/bookings/:id` 👑🛡️♻️ — owner edit (notes, priority tier before check-in).
- [ ] `POST /v1/businesses/:businessId/bookings/:id/check-in` 🔒🛡️ — mark `CHECKED_IN` (legacy / optional manual arrival flag).
- [ ] `POST /v1/businesses/:businessId/bookings/:id/no-show` 🔒🛡️ — explicit `NO_SHOW` transition (separate from the queue-skip path so a customer can be marked no-show even when not at the head of the queue).

### Reporting

- [ ] `GET /v1/businesses/:businessId/bookings/stats?from=&to=` 👑🛡️ — counts by status, no-show rate, average wait time, peak hour.

---

## 7. Queue (real-time)

> The issue #5 surface is complete. The remaining pieces are
> the **public live display** (TV screen at the storefront) and the
> **QR ticket** (paper ticket handed to walk-ins at the counter).

- [ ] `GET /v1/businesses/:slug/queue/now` 🌐⏱ — minimal public snapshot for the customer PWA "live queue" page: `{ serving: { ticket, name }, upcoming: [{ ticket, name, estWait }], waitingCount }`. No PII beyond initials — driven by a `displayName` projection in the queue query.
- [ ] `GET /v1/businesses/:slug/queue/display` 🌐⏱ — full-screen TV display payload (now-serving + next 5 + total waiting). Powers the in-store monitor.
- [ ] `GET /v1/businesses/:businessId/queue/wait-estimate?serviceId=&slotStart=` 🔒🛡️ — computed ETA based on rolling average of recent `completedAt - servingAt` for the business.
- [ ] `GET /v1/businesses/:businessId/queue/now-serving` 🔒🛡️ — the one currently at the counter (for the dashboard header).
- [ ] `POST /v1/businesses/:businessId/queue/tickets` 👑🛡️♻️ — mint a paper **QR ticket** for a walk-in: returns a one-time QR code that the customer scans to see their live position (no SMS). The walk-in flow remains the same; this is an alternative notification channel.
- [ ] `GET /v1/queue/tickets/:code` 🌐 — scan target for paper tickets; resolves to the booking + live position (no PII leak).

### WebSocket gateway (`/queue` namespace)

> `QueueGateway` already exists and broadcasts `booking.changed`.
> The remaining events to standardize and document:

- [x] `booking.changed` — delta `{ id, status, ticketNumber, priorityTier, position }`.
- [x] `queue.updated` — full snapshot push (throttled / on-demand).
- [ ] `queue.head.changed` — fires only when the ticket at the head changes; cheaper for the owner dashboard header.
- [ ] `ticket.scanned` — emitted when a paper ticket is scanned (owner dashboard can show a "scanned!" toast).

---

## 8. Notifications (SMS)

> `NotificationsService` exists; the controller is empty. These
> expose what's been sent and let the owner re-trigger.

- [ ] `GET /v1/businesses/:businessId/messages` 👑🛡️ — paginated `Message` log, filter by `templateId`, `status`, `from`/`to`, `bookingId`.
- [ ] `GET /v1/businesses/:businessId/messages/:id` 👑🛡️ — single message + provider delivery status.
- [ ] `POST /v1/bookings/:id/messages/resend` 👑🛡️♻️ — owner re-send of the confirmation SMS (rate-limited; uses a `kind = "MANUAL_RESEND"` `Reminder` row so it doesn't double-fire with the scheduled T-10/T-60).
- [ ] `GET /v1/notifications/templates` 🔒 — list available SMS templates + their variable shapes (for the owner "preview" UI).

### Webhook (provider → us)

- [ ] `POST /v1/webhooks/sms/:provider` 🌐 — inbound delivery status from Semaphore / Twilio. Verifies provider signature, updates `Message.status`, `deliveredAt`. Idempotent by `providerMessageId`.

---

## 9. Reminders (BullMQ)

> Scheduling logic exists; the **read** surface for the owner to audit
> "did the T-10 actually fire for booking X?" is missing.

- [ ] `GET /v1/businesses/:businessId/reminders` 👑🛡️ — list scheduled / sent / failed reminders; filter by `kind`, `status`, date range.
- [ ] `GET /v1/bookings/:id/reminders` 🔒🛡️ — per-booking reminder audit.
- [ ] `POST /v1/bookings/:id/reminders/:kind/retry` 👑🛡️♻️ — re-enqueue a failed reminder (uses deterministic `${bookingId}:${kind}` jobId so it's a no-op if already scheduled).

---

## 10. Owner dashboard (composite read endpoints)

> The dashboard hits several small queries per render. These composite
> endpoints collapse them into a single round-trip and are the
> natural integration target for SSR.

- [ ] `GET /v1/businesses/:businessId/dashboard/summary` 🔒🛡️ — today's queue count by status, no-shows so far, average wait, currently-serving ticket.
- [ ] `GET /v1/businesses/:businessId/dashboard/timeline?date=` 🔒🛡️ — per-hour booking density for the sparkline.
- [ ] `GET /v1/businesses/:businessId/dashboard/now` 🔒🛡️ — the "what changed since I last looked" delta since `?since=`.

---

## 11. Customer PWA (public, mobile-first)

> Most of these wrap business/service/slot/booking reads. Listed
> separately so the QR landing flow has one section.

- [ ] `GET /v1/p/:businessSlug` 🌐 — landing page payload (business + active services + today's open/closed) in one call.
- [ ] `POST /v1/p/:businessSlug/bookings` 🌐⏱♻️ — alias of the existing `POST /businesses/:slug/bookings`, kept here for the public route map.
- [ ] `GET /v1/p/:businessSlug/queue/now` 🌐⏱ — public live queue (same payload as `queue/now`).
- [ ] `GET /v1/p/:businessSlug/queue/display` 🌐⏱ — public TV display payload.

---

## 12. Auth additions (gaps in the current module)

- [ ] `POST /v1/auth/password/reset/request` 🌐⏱ — trigger forgot-password email.
- [ ] `POST /v1/auth/password/reset/confirm` 🌐⏱ — set new password from emailed token.
- [ ] `POST /v1/auth/password/change` 🔒 — change password while signed in (requires current password).
- [ ] `GET /v1/auth/sessions` 🔒 — list active refresh tokens (with `userAgent`, `ip`, `lastUsedAt`) for the "sign out everywhere" UI.
- [ ] `DELETE /v1/auth/sessions/:id` 🔒 — revoke one refresh token.
- [ ] `POST /v1/auth/email/verify/request` 🔒 — resend verification email.
- [ ] `POST /v1/auth/email/verify/confirm` 🔒 — consume the verification token.

---

## 13. Onboarding (first-run flow)

- [ ] `GET /v1/onboarding/state` 🔒 — what steps the new owner has completed (tenant set, first business created, first service created, first booking received). Drives the wizard.
- [ ] `POST /v1/onboarding/complete-step` 🔒♻️ — mark a step done (idempotent).

---

## 14. Localization

- [ ] `GET /v1/i18n/:lang` 🌐 — fetch the dictionary for `lang` (fil, ceb, en, …) from `@takda/shared` so the PWA can be fully offline.

---

## 15. Suggested issue breakdown (for the GitHub project)

The bucketlist above maps cleanly to the existing issue labels
(`area:*`, `priority:*`, `milestone:*`). Suggested slicing:

| #   | Title                                   | Area          | Milestone       |
| --- | --------------------------------------- | ------------- | --------------- |
| 26  | Health, readiness, metrics              | infra         | Foundation      |
| 27  | Tenant endpoints (read / update)        | tenants       | Foundation      |
| 28  | Business CRUD + membership              | businesses    | Foundation      |
| 29  | Service CRUD                            | services      | Foundation      |
| 30  | Day overrides                           | businesses    | Foundation      |
| 31  | Public slots / availability             | slots         | Customer PWA    |
| 32  | Owner capacity + 14-day calendar        | slots         | Owner Dashboard |
| 33  | Customer booking read / edit / cancel   | bookings      | Customer PWA    |
| 34  | Owner booking list + filters + stats    | bookings      | Owner Dashboard |
| 35  | Public live queue + display             | queue         | Customer PWA    |
| 36  | Paper QR ticket flow                    | queue         | Owner Dashboard |
| 37  | Wait-time estimation                    | queue         | Owner Dashboard |
| 38  | Notifications message log + resend      | notifications | Owner Dashboard |
| 39  | SMS provider webhook                    | webhooks      | Foundation      |
| 40  | Reminders read + retry                  | reminders     | Owner Dashboard |
| 41  | Dashboard composite endpoints           | dashboard     | Owner Dashboard |
| 42  | Auth — password reset, sessions, verify | auth          | Foundation      |
| 43  | Onboarding wizard endpoints             | onboarding    | Foundation      |
| 44  | Public PWA route aliases                | web           | Customer PWA    |
| 45  | i18n dictionary endpoint                | web           | Customer PWA    |
| 46  | Audit log read                          | observability | Foundation      |

---

## 16. Out of scope for v1 (deferred to a later milestone)

Listed so future contributors don't accidentally stub them in:

- Payments / tipping.
- Native mobile app push notifications (we use SMS + in-app WebSocket only).
- Multi-tenant SaaS billing flows.
- Analytics warehouse export.
- Customer-side accounts (customers identify by phone + queue-token, not login).
- International SMS (PH numbers only in v1).
