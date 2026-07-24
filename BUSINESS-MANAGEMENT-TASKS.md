# Business Management — Task Breakdown (GitHub Issue #3)

> **Source issue:** [GioMjds/takda#3 — Business Management](https://github.com/GioMjds/takda/issues/3)
> **Milestone:** Business Management
> **Status:** Planning — no code yet. Once approved, each section becomes a sub-issue in the same milestone.

This file is a planning artifact only. It maps the 13 checkboxes on
issue #3 to (a) one sub-issue per checkbox, (b) the files each
sub-issue will create or touch, and (c) the AGENTS.md rules that
govern the work. No code is being written here.

---

## 0. How to read this

- Every sub-issue is **self-contained**: it has a goal, an explicit
  file list (in repo-relative paths), the Prisma / Zod changes it
  implies, and a definition of done that matches the root
  `AGENTS.md` §4.4.
- Schema work happens in `packages/shared` first (Zod is the
  contract); the Prisma model and the API service are written in
  the same PR per the root `AGENTS.md` §7 and the API `AGENTS.md`
  §18.
- "Employee" in the issue body maps onto the existing
  `User` + `Membership` pair in `apps/api/prisma/schema.prisma`
  (lines 34–65). The "Employee module" sub-issue is a thin
  CRUD/UI layer over `Membership`, not a new identity model.
  This is called out in the sub-issue body so reviewers don't
  re-litigate the model.

---

## 1. Suggested sub-issue ordering

The 13 sub-issues have to ship in this order, because later ones
depend on the schema and modules earlier ones introduce. Reordering
will produce broken typecheck.

| #   | Sub-issue               | Depends on |
| --- | ----------------------- | ---------- |
| 1   | Business module         | —          |
| 2   | Branch module           | #1         |
| 3   | Employee module         | #1         |
| 4   | Staff invitation system | #3         |
| 5   | Business settings       | #1         |
| 6   | Working hours           | #1         |
| 7   | Holiday schedules       | #1, #6     |
| 8   | Service categories      | #1         |
| 9   | Service management      | #8         |
| 10  | Employee assignments    | #3, #9     |
| 11  | Business profile page   | #1, #5     |
| 12  | Branch management UI    | #2         |
| 13  | Service management UI   | #9         |

Open the milestone first, then create issues #1–#13 in that order
so the dependency arrows in the GitHub project read top-down.

---

## 2. Sub-issues (one section per checkbox)

Each section is a copy-paste-ready sub-issue body. Title prefixes
match the issue body; the **Files** block is the concrete diff
surface.

### Sub-issue #1 — Business module

**Body**

> The `Business` Prisma model and `BusinessesModule` skeleton
> already exist (`apps/api/prisma/schema.prisma:88-113`,
> `apps/api/src/businesses/`). This sub-issue wires the model up:
> CRUD endpoints, owner-scoped listing, slug uniqueness, and the
> `business` Zod output schema. No new Prisma model is added —
> the model is already there; we are exposing it.
>
> Endpoints (all under `JwtAuthGuard` + `RolesGuard`):
>
> - `POST   /v1/businesses` — create (the first business a user owns)
> - `GET    /v1/businesses` — list businesses the caller has a membership on
> - `GET    /v1/businesses/:idOrSlug` — fetch one
> - `PATCH  /v1/businesses/:idOrSlug` — partial update (name, address, phone, timezone)
> - `DELETE /v1/businesses/:idOrSlug` — soft delete via `isActive = false`
>
> Slug uniqueness is `(tenantId, slug)` (already in the schema). The
> service layer must re-check inside a transaction so two concurrent
> creates can't both pass the existence check.
>
> **Files**
>
> - `packages/shared/src/schemas/business.ts` — extend with
>   `createBusinessInput`, `updateBusinessInput`,
>   `listBusinessesQuery` (Zod).
> - `packages/shared/src/schemas/index.ts` — re-export new schemas.
> - `packages/shared/src/constants/errors.ts` — add
>   `BUSINESS_SLUG_TAKEN`, `BUSINESS_NOT_OWNED`.
> - `apps/api/src/businesses/businesses.service.ts` — implement
>   `create`, `findAll`, `findOne`, `update`, `softDelete` with
>   `prisma.$transaction` on create/update.
> - `apps/api/src/businesses/businesses.controller.ts` — add the
>   five routes above; use `ZodValidationPipe` on every body/query.
> - `apps/api/src/businesses/businesses.module.ts` — export
>   `BusinessesService` (it is consumed by #2, #3, #5–#9).
> - `apps/api/src/businesses/__tests__/businesses.service.spec.ts` —
>   happy-path create + one failure mode (duplicate slug, 409
>   `BUSINESS_SLUG_TAKEN`).
> - `apps/api/test/businesses.e2e-spec.ts` — auth-guarded list/create
>   against a test DB.
>
> **Done when**
>
> - `pnpm --filter @takda/shared typecheck` and `pnpm --filter
@takda/api typecheck` pass.
> - `pnpm --filter @takda/api test` passes the new spec.
> - `pnpm --filter @takda/api lint` clean.
> - `pnpm build` at the root passes.

### Sub-issue #2 — Branch module

**Body**

> A `Branch` is a physical location of a business (e.g. "Stall #3,
> Pamilihang Bayan ng Pasig"). Many small walk-in businesses have
> one branch; chains have several. Each business has 1..N branches,
> and bookings/queue scope to one branch.
>
> New Prisma model in `apps/api/prisma/schema.prisma`:
>
> ```prisma
> model Branch {
>   id         String   @id @default(cuid())
>   businessId String
>   name       String
>   address    String?
>   phone      String?
>   isActive   Boolean  @default(true)
>   createdAt  DateTime @default(now())
>   updatedAt  DateTime @updatedAt
>
>   business Business   @relation(fields: [businessId], references: [id], onDelete: Cascade)
>   bookings Booking[]
>
>   @@unique([businessId, name])
>   @@index([businessId])
> }
> ```
>
> `Booking.branchId String?` is added (nullable for back-compat with
> rows predating branching — they can be backfilled later). Existing
> `Service` becomes optional-FK to a `Branch` via
> `Service.branchId String?` (services can be branch-specific;
> business-wide services leave it null).
>
> **Files**
>
> - `apps/api/prisma/schema.prisma` — add `Branch` model,
>   `Booking.branchId`, `Service.branchId`, and the matching
>   relation fields. Migration name: `add_branch_model`.
> - `apps/api/prisma/migrations/<ts>_add_branch_model/` — generated.
> - `packages/shared/src/schemas/branch.ts` — new file:
>   `branchSchema`, `createBranchInput`, `updateBranchInput`.
> - `packages/shared/src/schemas/index.ts` — re-export.
> - `packages/shared/src/constants/errors.ts` — add
>   `BRANCH_NOT_FOUND`, `BRANCH_NOT_IN_BUSINESS`.
> - `apps/api/src/branches/branches.module.ts` — new feature module.
> - `apps/api/src/branches/branches.service.ts` — `create`,
>   `listForBusiness`, `findOne`, `update`, `softDelete`.
> - `apps/api/src/branches/branches.controller.ts` — REST controller
>   at `/v1/businesses/:businessId/branches`.
> - `apps/api/src/branches/__tests__/branches.service.spec.ts` —
>   happy path + cross-business isolation failure.
> - `apps/api/src/app.module.ts` — register `BranchesModule`.
> - `apps/api/src/businesses/businesses.module.ts` — re-export
>   nothing extra; branches only depend on `PrismaService` and
>   `BusinessesService` (for membership checks).
>
> **Done when** the standard §4.4 checklist is green and the
> migration is committed.

### Sub-issue #3 — Employee module

**Body**

> The issue calls this "Employee module", but our schema (root
> `AGENTS.md` §6) models identity as `User` + `Membership`. The
> Employee concept is a `Membership` row with `role` `STAFF` or
> `MANAGER` (a `User` is "an employee" only in the context of a
> `Membership` to a business — the same `User` can be a customer
> elsewhere, with no membership at all). This sub-issue builds
> the CRUD layer over `Membership`.
>
> **Files**
>
> - `packages/shared/src/schemas/employee.ts` — new file:
>   `employeeSchema`, `createEmployeeInput`, `updateEmployeeInput`,
>   `listEmployeesQuery`. `createEmployeeInput` accepts an
>   existing `userId` (see #4 for the invite path) **or** an
>   inline `{ name, email, phone }` to create-and-link a fresh
>   `User` in one transaction.
> - `packages/shared/src/schemas/index.ts` — re-export.
> - `packages/shared/src/constants/errors.ts` — add
>   `EMPLOYEE_NOT_FOUND`, `EMPLOYEE_ALREADY_EXISTS`,
>   `EMPLOYEE_LAST_OWNER` (cannot remove the last `OWNER`
>   membership).
> - `apps/api/src/employees/employees.module.ts` — new module.
> - `apps/api/src/employees/employees.service.ts` — `add`,
>   `listForBusiness`, `updateRole`, `remove`. All membership
>   mutations go through `prisma.$transaction` and re-check that
>   the caller is `OWNER`/`MANAGER` of the business.
> - `apps/api/src/employees/employees.controller.ts` —
>   `/v1/businesses/:businessId/employees`.
> - `apps/api/src/employees/__tests__/employees.service.spec.ts` —
>   happy path, last-owner removal rejected, duplicate-email
>   rejection (one per tenant, per root `AGENTS.md` §6).
> - `apps/api/src/app.module.ts` — register `EmployeesModule`.
>
> **Done when** §4.4 is green. The removal flow must reject
> "last owner" with `EMPLOYEE_LAST_OWNER` and a typed 409.

### Sub-issue #4 — Staff invitation system

**Body**

> Owners/managers invite staff by email; the staff receive a
> signed token via email, accept it, and (if they don't already
> have a `User` row) one is created at acceptance time. This is
> separate from the public signup flow (root `AGENTS.md` §1:
> customers don't log in, only owners/staff do).
>
> New Prisma model:
>
> ```prisma
> model StaffInvite {
>   id          String    @id @default(cuid())
>   businessId  String
>   email       String
>   role        MembershipRole
>   tokenHash   String    @unique
>   invitedById String
>   expiresAt   DateTime
>   acceptedAt  DateTime?
>   revokedAt   DateTime?
>   createdAt   DateTime  @default(now())
>
>   business Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
>   invitedBy User    @relation("InvitedBy", fields: [invitedById], references: [id])
>
>   @@index([businessId, email])
>   @@index([expiresAt])
> }
> ```
>
> **Files**
>
> - `apps/api/prisma/schema.prisma` — add `StaffInvite`. Migration
>   name: `add_staff_invite`.
> - `packages/shared/src/schemas/invite.ts` — `createInviteInput`,
>   `acceptInviteInput` (`{ token: string }`).
> - `packages/shared/src/constants/errors.ts` — add
>   `INVITE_INVALID`, `INVITE_EXPIRED`, `INVITE_REVOKED`.
> - `apps/api/src/invites/invites.module.ts` — new module.
> - `apps/api/src/invites/invites.service.ts` — `create` (signs
>   token with `JWT_SECRET`, stores hash), `revoke`, `accept`.
> - `apps/api/src/invites/invites.controller.ts` —
>   `POST /v1/businesses/:businessId/invites` (owner-only),
>   `POST /v1/invites/:token/accept` (`@Public()`),
>   `DELETE /v1/businesses/:businessId/invites/:id` (owner-only).
> - `apps/api/src/email/mail.service.ts` — extend with
>   `sendStaffInvite(to, businessName, acceptUrl)` template. New
>   template id `staff.invite`. Reuse the existing MailService
>   scaffold (already imported in `app.module.ts`).
> - `apps/api/src/employees/employees.service.ts` — `acceptInvite`
>   delegates here to create the `Membership` row in the same
>   transaction that marks the invite accepted.
> - `apps/api/src/invites/__tests__/invites.service.spec.ts` —
>   token round-trip, expiry, replay rejection.
>
> **Done when** an invite can be created, the email is rendered
> with the accept link, the accept endpoint creates the
> `Membership`, and the `tokenHash` matches what was stored.

### Sub-issue #5 — Business settings

**Body**

> Generic "preferences" that don't have a dedicated sub-issue:
> SMS opt-in flags, default reminder lead time, language,
> notification channel preference, etc. We don't anticipate
> needing 30 of these; we keep the schema narrow and add fields
> only when a feature needs them.
>
> Settings are stored as a `Json` column on `Business` (a
> discriminated JSON object validated by a Zod schema) — this
> avoids a migration per flag. v1 settings:
>
> - `defaultReminderLeadMinutes: 10 | 30 | 60`
> - `smsOptIn: boolean` (default `true`)
> - `language: 'en' | 'tl'`
> - `bookingCutoffMinutes: number` (default `0`, owner can stop
>   accepting bookings N minutes before slot start)
>
> **Files**
>
> - `apps/api/prisma/schema.prisma` — add
>   `Business.settings Json @default("{}")`.
> - `packages/shared/src/schemas/business-settings.ts` — new
>   `businessSettingsSchema`, `updateBusinessSettingsInput`
>   (`.partial()`).
> - `packages/shared/src/schemas/business.ts` — add
>   `settings: businessSettingsSchema` to `businessSchema`.
> - `apps/api/src/businesses/businesses.service.ts` — extend
>   `update()` to accept and merge the `settings` patch. Merge,
>   not replace — owners don't lose unspecified keys.
> - `apps/api/src/businesses/businesses.controller.ts` — add
>   `PATCH /v1/businesses/:idOrSlug/settings`.
> - `apps/api/src/businesses/__tests__/businesses-settings.spec.ts`
>   — merge semantics, unknown key rejected by `z.strict()`.
>
> **Done when** the merge path round-trips a partial patch and
> unknown keys are rejected with `VALIDATION_ERROR`.

### Sub-issue #6 — Working hours

**Body**

> Per-business open/close per day-of-week. A barbershop might be
> Mon–Sat 09:00–19:00, closed Sun. The existing `Service` already
> has `openTime`, `closeTime`, `daysOfWeekMask`
> (`apps/api/prisma/schema.prisma:148-176`) — those are _service_
> hours. Business hours are the outer envelope: a service's
> `openTime/closeTime` must be within the business's hours for
> that day, or the slot generator should refuse to emit slots.
>
> New Prisma model:
>
> ```prisma
> model WorkingHours {
>   id         String @id @default(cuid())
>   businessId String
>   /// 0 = Sunday ... 6 = Saturday
>   dayOfWeek  Int
>   openTime   String  // "HH:mm" business-local
>   closeTime  String  // "HH:mm" business-local
>   isClosed   Boolean @default(false)
>
>   business Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
>
>   @@unique([businessId, dayOfWeek])
> }
> ```
>
> **Files**
>
> - `apps/api/prisma/schema.prisma` — add `WorkingHours`.
>   Migration: `add_working_hours`.
> - `packages/shared/src/schemas/working-hours.ts` — new file:
>   `workingHoursSchema`, `upsertWorkingHoursInput`.
> - `packages/shared/src/utils/business-day.ts` — extend with
>   `isWithinBusinessHours(workingHours, day, time)` (a pure
>   helper; testable in `packages/shared`).
> - `packages/shared/src/utils/__tests__/business-day.test.ts` —
>   add cases for the new helper.
> - `apps/api/src/working-hours/working-hours.module.ts` — new
>   module.
> - `apps/api/src/working-hours/working-hours.service.ts` —
>   `upsertMany(businessId, rows[])` (one call, not N round-trips
>   for a 7-row form).
> - `apps/api/src/working-hours/working-hours.controller.ts` —
>   `GET` and `PUT /v1/businesses/:businessId/working-hours`.
> - `apps/api/src/slots/slots.service.ts` — **integration point**:
>   slot generation rejects if a service's `openTime/closeTime`
>   is outside the business's `WorkingHours` for that day. If
>   the slot module already exists, the check goes there; if not,
>   stub it with `// TODO: enforce after slots module lands` and
>   file a follow-up.
> - `apps/api/src/working-hours/__tests__/working-hours.service.spec.ts`.
>
> **Done when** a 7-row PUT round-trips, the helper passes its
> tests, and the slot-integration is wired or explicitly deferred
> with a follow-up issue.

### Sub-issue #7 — Holiday schedules

**Body**

> The `DayOverride` model already exists
> (`apps/api/prisma/schema.prisma:117-138`) for per-day
> "closed / override hours / capacity override / note". This
> sub-issue is the CRUD layer over it, plus a generator hook
> so the slot engine honors it.
>
> **Files**
>
> - `packages/shared/src/schemas/day-override.ts` — new file:
>   `dayOverrideSchema`, `createDayOverrideInput`,
>   `updateDayOverrideInput`, `listDayOverridesQuery`
>   (`from` / `to` date range).
> - `packages/shared/src/schemas/index.ts` — re-export.
> - `apps/api/src/day-overrides/day-overrides.module.ts` — new
>   module.
> - `apps/api/src/day-overrides/day-overrides.service.ts` —
>   `create`, `list(businessId, from, to)`, `update`, `remove`.
>   `date` is a `Date` in the business timezone (use
>   `businessDayBoundsUtc` from `@takda/shared/utils/business-day`
>   to compute the UTC boundary).
> - `apps/api/src/day-overrides/day-overrides.controller.ts` —
>   `GET/POST/PATCH/DELETE /v1/businesses/:businessId/day-overrides`.
> - `apps/api/src/day-overrides/__tests__/day-overrides.service.spec.ts`
>   — happy path, invalid `date` (rejected by Zod as
>   "must be a calendar date, not a timestamp").
> - `apps/api/src/slots/slots.service.ts` — **integration**:
>   honor `DayOverride.isClosed` (no slots) and
>   `DayOverride.capacityOverride` (cap day's bookings).
>   Same deferral rule as #6 if the slots module isn't in yet.
> - `apps/api/src/app.module.ts` — register `DayOverridesModule`.
>
> **Done when** CRUD passes and the slot-integration is wired or
> deferred with a follow-up.

### Sub-issue #8 — Service categories

**Body**

> A grouping for `Service` rows so an owner can offer "Haircut",
> "Beard trim", "Hair wash" under a "Grooming" category, and
> "Facial", "Manicure" under "Spa". Categories are per-business
> and optional (a service without a category is fine).
>
> New Prisma model:
>
> ```prisma
> model ServiceCategory {
>   id         String  @id @default(cuid())
>   businessId String
>   name       String
>   sortOrder  Int     @default(0)
>   isActive   Boolean @default(true)
>   createdAt  DateTime @default(now())
>   updatedAt  DateTime @updatedAt
>
>   business  Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)
>   services  Service[]
>
>   @@unique([businessId, name])
>   @@index([businessId, sortOrder])
> }
> ```
>
> `Service.categoryId String?` is added.
>
> **Files**
>
> - `apps/api/prisma/schema.prisma` — add `ServiceCategory`,
>   `Service.categoryId`. Migration: `add_service_category`.
> - `packages/shared/src/schemas/service-category.ts` —
>   `serviceCategorySchema`, `createServiceCategoryInput`,
>   `updateServiceCategoryInput`.
> - `apps/api/src/service-categories/service-categories.module.ts`
>   — new module.
> - `apps/api/src/service-categories/service-categories.service.ts`
>   — CRUD, ordered by `sortOrder` asc.
> - `apps/api/src/service-categories/service-categories.controller.ts`
>   — `/v1/businesses/:businessId/service-categories`.
> - `apps/api/src/service-categories/__tests__/service-categories.service.spec.ts`.
> - `apps/api/src/app.module.ts` — register.
>
> **Done when** CRUD works and `Service.categoryId` is queryable.

### Sub-issue #9 — Service management

**Body**

> Full CRUD for the `Service` model that already exists
> (`apps/api/prisma/schema.prisma:148-176`), with the
> `branchId` (from #2) and `categoryId` (from #8) hooks landed.
> The service module is **not** the slot generator — slot math
> is a separate concern (root `AGENTS.md` §6: "capacity is
> _derived_ from this config"). The `Services` module writes
> the config; the `Slots` module (deferred, see #6) reads it.
>
> **Files**
>
> - `apps/api/src/services/services.service.ts` — fill in the
>   existing scaffold (the module file is implied by §2 of the
>   API `AGENTS.md`; if the file doesn't exist yet, create it).
>   Methods: `create`, `listForBusiness`, `findOne`,
>   `update` (uses `patchServiceInput`), `softDelete`
>   (`isActive = false`).
> - `apps/api/src/services/services.controller.ts` —
>   `/v1/businesses/:businessId/services`.
> - `packages/shared/src/schemas/service.ts` — add
>   `createServiceInput`, `updateServiceInput` (`.partial()`),
>   `listServicesQuery`. `daysOfWeekMask` is an `Int` on the
>   model; expose a `daysOfWeek: ('SUN' | 'MON' | ... | 'SAT')[]`
>   convenience in the Zod schema and translate at the
>   controller boundary.
> - `packages/shared/src/schemas/index.ts` — re-export.
> - `packages/shared/src/utils/business-day.ts` — add
>   `daysOfWeekToMask(days: DayOfWeek[]): number` and
>   `maskToDaysOfWeek(mask: number): DayOfWeek[]`.
> - `packages/shared/src/utils/__tests__/business-day.test.ts` —
>   add mask round-trip cases.
> - `packages/shared/src/constants/errors.ts` — add
>   `SERVICE_INVALID_HOURS` (closeTime must be > openTime),
>   `SERVICE_INVALID_DURATION` (duration must evenly divide the
>   window).
> - `apps/api/src/services/__tests__/services.service.spec.ts` —
>   happy path + the two new validation failures.
> - `apps/api/src/app.module.ts` — register `ServicesModule`.
>
> **Done when** the new validation rules fire and the mask
> helper passes its tests.

### Sub-issue #10 — Employee assignments

**Body**

> An employee can be assigned to one or more services
> (e.g. "Maria is the only one who does facials"). The
> assignment table also tracks an optional day-of-week mask
> so a per-employee schedule can be expressed later without
> another table.
>
> New Prisma model:
>
> ```prisma
> model EmployeeAssignment {
>   id           String @id @default(cuid())
>   membershipId String
>   serviceId    String
>   daysOfWeekMask Int  @default(127)
>   createdAt    DateTime @default(now())
>
>   membership Membership @relation(fields: [membershipId], references: [id], onDelete: Cascade)
>   service    Service    @relation(fields: [serviceId], references: [id], onDelete: Cascade)
>
>   @@unique([membershipId, serviceId])
>   @@index([serviceId])
> }
> ```
>
> **Files**
>
> - `apps/api/prisma/schema.prisma` — add `EmployeeAssignment`,
>   relation fields on `Membership` and `Service`. Migration:
>   `add_employee_assignment`.
> - `packages/shared/src/schemas/employee-assignment.ts` —
>   `employeeAssignmentSchema`, `createEmployeeAssignmentInput`.
> - `apps/api/src/employees/employees.service.ts` — extend with
>   `assignService`, `unassignService`, `listAssignments`.
> - `apps/api/src/employees/employees.controller.ts` — add the
>   three sub-routes under
>   `/v1/businesses/:businessId/employees/:membershipId/services`.
> - `apps/api/src/employees/__tests__/employee-assignments.spec.ts`
>   — happy path, duplicate assignment rejected, cross-business
>   `serviceId` rejected.
> - `apps/api/src/bookings/bookings.service.ts` — **integration**:
>   when creating a `Booking`, optionally accept `assignedToId`
>   and validate it via this table. If the booking service isn't
>   ready for the change, defer with a follow-up issue.
>
> **Done when** assignments round-trip, the integration is wired
> or explicitly deferred.

### Sub-issue #11 — Business profile page

**Body**

> The public, customer-facing business profile page (the one
> reached by scanning a business's QR code). The page already
> exists at
> `apps/web/app/[lang]/(customer)/b/[businessSlug]/page.tsx`
> and
> `apps/web/views/[lang]/b/[businessSlug]/`. The profile
> surfaces: business name, address, phone, hours, and a
> list of services (with categories from #8 once it lands).
>
> This sub-issue is **the read path** for everything #1–#9
> produced. Most of the page already exists; the work is to
> extend it to render the new data and to add the settings
> hook (e.g. show the business's chosen `language`).
>
> **Files**
>
> - `apps/web/lib/api.ts` — add typed fetchers:
>   `getBusinessBySlug(slug)`, `getBusinessServices(businessId)`,
>   `getBusinessWorkingHours(businessId)`.
> - `apps/web/views/[lang]/b/[businessSlug]/sections/business-header.tsx`
>   — render name, address, phone, hours summary.
> - `apps/web/views/[lang]/b/[businessSlug]/sections/service-list.tsx`
>   — group services by category (from #8). If the categories
>   sub-issue hasn't shipped yet, render a flat list and add a
>   `// TODO(#8)` so the merge is obvious.
> - `apps/web/views/[lang]/b/[businessSlug]/sections/hours-table.tsx`
>   — weekly hours table, with "Closed" rows for `isClosed`
>   days and an "Open today until HH:mm" pill at the top.
> - `apps/web/views/[lang]/b/[businessSlug]/hooks/use-business-profile.ts`
>   — wraps the three fetchers and the `useBusinessDay` helper
>   from `@takda/shared`.
> - `apps/web/app/[lang]/(customer)/b/[businessSlug]/loading.tsx` —
>   verify the existing skeleton still matches the new layout
>   dimensions (root `AGENTS.md` §4.6: skeletons must match
>   layout to avoid CLS).
> - `apps/web/app/[lang]/(customer)/b/[businessSlug]/not-found.tsx`
>   — verify it triggers on `BUSINESS_NOT_FOUND` from the
>   shared error code.
> - `apps/web/views/[lang]/b/[businessSlug]/__tests__/business-header.test.tsx`
>   — RTL render with a fixture business, an a11y assertion
>   (`getByRole('heading', { level: 1 })`).
>
> **Done when** `pnpm --filter @takda/web typecheck` passes
> (typed routes are validated), the page renders against a
> fixture, and a11y assertions pass.

### Sub-issue #12 — Branch management UI

**Body**

> Owner dashboard page for listing/creating/editing branches
> (sub-issue #2 produced the API). Route lives under the
> existing `(owner)/dashboard/` group. Mirrors the views
> layout pattern from `apps/web/AGENTS.md` §3.
>
> **Files**
>
> - `apps/web/app/[lang]/(owner)/dashboard/branches/page.tsx`
>   — thin wrapper, Server Component, calls
>   `PageProps<'/[lang]/(owner)/dashboard/branches'>`.
> - `apps/web/app/[lang]/(owner)/dashboard/branches/layout.tsx`
>   — owner-area layout (the parent `(owner)/dashboard/layout.tsx`
>   already guards auth; this is a per-page sub-layout for
>   breadcrumbs / tabs).
> - `apps/web/app/[lang]/(owner)/dashboard/branches/loading.tsx`
>   — shadcn `Skeleton` matching the list row height.
> - `apps/web/app/[lang]/(owner)/dashboard/branches/new/page.tsx`
>   — create form route.
> - `apps/web/app/[lang]/(owner)/dashboard/branches/[branchId]/page.tsx`
>   — edit form route.
> - `apps/web/views/[lang]/dashboard/branches/index.ts` —
>   barrel.
> - `apps/web/views/[lang]/dashboard/branches/sections/branch-list.tsx`
>   — table of branches with status pill (active / inactive).
> - `apps/web/views/[lang]/dashboard/branches/sections/branch-form.tsx`
>   — RHF + Zod (schema from `packages/shared`) create/edit
>   form. `'use client'` per root `AGENTS.md` §4.6.
> - `apps/web/views/[lang]/dashboard/branches/hooks/use-branches.ts`
>   — wraps `listBranches`, `createBranch`, `updateBranch`,
>   `deleteBranch` fetchers in `lib/api.ts`.
> - `apps/web/views/[lang]/dashboard/branches/api/{GET,POST,PUT,DELETE}.ts`
>   — fetch files per `apps/web/AGENTS.md` §3.
> - `apps/web/views/[lang]/dashboard/branches/__tests__/branch-form.test.tsx`
>   — submit happy path + one validation failure.
>
> **Done when** the page typechecks against typed routes, the
> form round-trips a create, and a11y assertions pass.

### Sub-issue #13 — Service management UI

**Body**

> Owner dashboard page for listing/creating/editing services
> (sub-issue #9 produced the API). Mirrors the structure of
> #12 but for `Service`. Includes a "Working hours" tab
> (sub-issue #6) and a "Categories" tab (sub-issue #8) on
> the service edit page.
>
> **Files**
>
> - `apps/web/app/[lang]/(owner)/dashboard/services/page.tsx`
>   — list page.
> - `apps/web/app/[lang]/(owner)/dashboard/services/layout.tsx`
>   — per-section layout.
> - `apps/web/app/[lang]/(owner)/dashboard/services/loading.tsx`
>   — skeleton.
> - `apps/web/app/[lang]/(owner)/dashboard/services/new/page.tsx`
>   — create form route.
> - `apps/web/app/[lang]/(owner)/dashboard/services/[serviceId]/page.tsx`
>   — edit form route (with tabs).
> - `apps/web/views/[lang]/dashboard/services/index.ts` —
>   barrel.
> - `apps/web/views/[lang]/dashboard/services/sections/service-list.tsx`
>   — table grouped by category (or flat if #8 hasn't shipped
>   yet — explicit `TODO(#8)`).
> - `apps/web/views/[lang]/dashboard/services/sections/service-form.tsx`
>   — RHF form, `'use client'`. Fields: name, description,
>   duration (minutes), capacity per slot, daily capacity,
>   open/close, days of week (checkbox group), category,
>   active toggle.
> - `apps/web/views/[lang]/dashboard/services/sections/service-tabs.tsx`
>   — server-rendered tab shell with three sections:
>   "Details", "Working hours", "Categories". Sub-sections
>   are their own Client Components where animated.
> - `apps/web/views/[lang]/dashboard/services/hooks/use-services.ts`
>   — RHF + zustand store for the multi-section form draft.
> - `apps/web/views/[lang]/dashboard/services/api/{GET,POST,PUT,DELETE}.ts`
>   — fetch files.
> - `apps/web/views/[lang]/dashboard/services/__tests__/service-form.test.tsx`
>   — submit happy path, days-of-week mask round-trips
>   through the form to the API, validation failures.
>
> **Done when** typecheck passes, form round-trips, days-of-week
> mask round-trips correctly (form's `'MTWThF'` becomes the
> right `Int` in the request and back), and a11y assertions pass.

---

## 3. Cross-cutting work that doesn't fit one sub-issue

These land alongside whichever sub-issue is in flight but aren't
a checkbox on their own. They are **not** sub-issues; they are
shared scaffolding that the sub-issues above depend on.

### 3.1 Shared package additions

`packages/shared` is the source of truth for the wire contract
(root `AGENTS.md` §7; `packages/shared/AGENTS.md` §3). The
following files are added by the sub-issues but are listed here
so the order is visible:

| Sub-issue | New file in `packages/shared/src/schemas/`         |
| --------- | -------------------------------------------------- |
| #1        | (extends) `business.ts`                            |
| #2        | `branch.ts`                                        |
| #3        | `employee.ts`                                      |
| #4        | `invite.ts`                                        |
| #5        | `business-settings.ts` (and extends `business.ts`) |
| #6        | `working-hours.ts`                                 |
| #7        | `day-override.ts`                                  |
| #8        | `service-category.ts`                              |
| #9        | (extends) `service.ts`                             |
| #10       | `employee-assignment.ts`                           |
| #11–#13   | no new schemas (consume existing)                  |

Every new schema file co-locates the input schema, the output
schema, the inferred input/output types, and follows the naming
in `packages/shared/AGENTS.md` §4.

### 3.2 Error codes

The `ERROR_CODES` constant in
`packages/shared/src/constants/errors.ts` is extended across
several sub-issues. Re-export the new codes from the index.
The web's `lib/api.ts` error mapper (the file that translates
codes to user-visible messages) is updated in the same PR as
the sub-issue that introduces the code — never deferred.

### 3.3 Audit logging

`AuditLog` (root `AGENTS.md` §6 — "Observability") is written
from every state-changing service in this milestone: business
created/updated, member added/removed/role-changed, invite
sent/accepted/revoked, working-hours changed, day-override
set, service created/updated, branch created/updated. Use
the existing `AuditInterceptor` if it already covers the
service; otherwise add an explicit `prisma.auditLog.create`
inside the same transaction (root `AGENTS.md` §6: append-only,
carries `requestId`).

### 3.4 Idempotency

Per `apps/api/AGENTS.md` §8, every `POST` in this milestone
that _creates_ a resource is wrapped with
`@node-idempotency/nestjs`. The invite-accept endpoint is
also `POST` and is the most likely to be retried (mail links
opened twice), so it's a hard requirement there.

### 3.5 Tests

`apps/api/AGENTS.md` §16: every service gets `*.spec.ts`
next to the file; every feature module gets an
`*.e2e-spec.ts` in `apps/api/test/`. The unit tests use Jest
mocks for `PrismaService`, `RedisService`,
`NotificationsService`. E2E tests spin up a Nest test module
against the test database.

`apps/web/AGENTS.md` §10: every new view/form gets a RTL test
with at least one a11y assertion. The form tests live in
`apps/web/views/<route>/__tests__/` and use the project's
existing test runner — check `apps/web/package.json` before
adding a new one.

---

## 4. Definition of done (applies to every sub-issue)

From root `AGENTS.md` §4.4, lifted into this milestone:

1. `pnpm build` at the root passes.
2. `pnpm typecheck` (per app) passes.
3. `pnpm lint` (per app) passes.
4. Unit test for new behavior exists.
5. No existing test, typecheck, lint, or build regressed.
6. No new `TODO` is left without an owner and a follow-up
   issue link.

In addition, this milestone adds:

7. Wire contract change is committed in `packages/shared`
   _before_ (or in the same PR as) the API/web change.
8. New `ERROR_CODES` entries are mapped in the web's
   `lib/api.ts` error mapper in the same PR.
9. New audit-log events for state changes are wired in the
   same PR as the service method.
10. Every new POST is idempotency-wrapped.

---

## 5. How to use this file

1. **Create the milestone** `Business Management` on GitHub
   (it already exists per the issue body).
2. **Create sub-issues #1–#13** by copying the **Body** blocks
   from §2. Add the labels `area:api`, `area:web`, and
   `area:shared` as appropriate, and assign the same milestone.
3. Set the `Blocks` / `Blocked by` relationships in the order
   shown in §1 (use the GitHub Projects dependencies view).
4. Each sub-issue body points at exact files; reviewers
   shouldn't have to re-derive the diff surface.
5. When a sub-issue lands, check off the corresponding
   checkbox on issue #3 and link the sub-issue in the
   comment.

No code is written from this file. Implementation starts when
the user approves this breakdown and creates the sub-issues.
