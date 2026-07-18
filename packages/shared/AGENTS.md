# AGENTS.md - Takda Shared (packages/shared)

> This file is **in addition to** the root [AGENTS.md](../../AGENTS.md).
> Read the root first — it has the monorepo rules, toolchain, and
> domain language. This file covers only what is specific to the
> shared package.

`@takda/shared` is the **only** workspace that `@takda/web` and
`@takda/api` import from each other. It holds:

- **Zod schemas** that are the single source of truth for every
  payload that crosses the API boundary.
- **TS types** inferred from those Zod schemas.
- **Pure utility functions** that are used in more than one place
  (date math, ID generation, currency formatting helpers, etc.).
- **Constants** (enum-like literal unions, error codes, capacity
  rules) shared by both sides.

It holds **no** runtime code that requires Node-only or browser-only
APIs. If a utility needs a platform API, mark it with a
`*.server.ts` or `*.client.ts` suffix and document the side
restriction in this file.

---

## 1. Stack snapshot

| Concern       | Choice                                        |
| ------------- | --------------------------------------------- |
| Language      | TypeScript (`strict`)                         |
| Validation    | Zod 4                                         |
| Module format | Plain ES modules (TS source)                  |
| Imports       | `@takda/shared` and `@takda/shared/<subpath>` |

No framework. No decorators. No class-based DTOs. No I/O. If a
file in this package imports from `next`, `react`, `@nestjs/*`,
`@prisma/client`, or `bullmq`, it's in the wrong place.

---

## 2. Directory layout

```folder
packages/shared/
├── src/
│   ├── index.ts                 # barrel; re-exports the public API
│   ├── schemas/                 # Zod schemas grouped by domain
│   │   ├── booking.ts           # createBookingInput, bookingStatus, ...
│   │   ├── business.ts
│   │   ├── service.ts
│   │   ├── slot.ts
│   │   ├── user.ts              # owner / staff user
│   │   ├── auth.ts              # login input, refresh, etc.
│   │   ├── notification.ts      # SMS template ids, message shape
│   │   └── index.ts             # re-exports
│   ├── types/                   # non-Zod TS types that don't fit a schema
│   │   ├── ids.ts               # branded id types (BookingId, etc.)
│   │   ├── api.ts               # envelope types (ok<T>, err, etc.)
│   │   └── index.ts
│   ├── constants/               # literal unions, error codes, capacity rules
│   │   ├── errors.ts            # ErrorCode union ('SLOT_FULL', ...)
│   │   ├── status.ts            # bookingStatus, queueEventName
│   │   ├── limits.ts            # MAX_SLOTS_PER_DAY, REMINDER_LEAD_MINUTES
│   │   └── index.ts
│   ├── utils/                   # pure functions
│   │   ├── time.ts              # slot math, Asia/Manila helpers
│   │   ├── phone.ts             # PH phone normalization
│   │   ├── ids.ts               # parse branded ids safely
│   │   ├── result.ts            # Result<T, E> helper
│   │   └── index.ts
│   └── __tests__/               # unit tests for utils and schemas
│       ├── schemas/
│       └── utils/
├── package.json                 # name: "@takda/shared"
├── tsconfig.json                # extends ../../tsconfig.json
└── AGENTS.md
```

`src/index.ts` is the only public entry. Everything not re-exported
from there is internal.

---

## 3. The contract: this is the API

Anything exported from `@takda/shared` is part of the **wire
contract** between the web and the API. Breaking changes require:

1. A discussion in the PR.
2. Coordinated updates to both `apps/web` and `apps/api` in the
   same PR (the API and the web are deployed together for v1).
3. A changelog entry under "Breaking" in the PR body.

Things you can change without a ceremony:

- Adding a new export.
- Adding an **optional** field to a schema (with `.optional()`).
- Tightening validation (rejecting what was previously accepted) —
  but call it out in the PR.

Things you cannot change without a ceremony:

- Removing or renaming an export.
- Changing a field's type.
- Making an optional field required.
- Changing the meaning of a status value (e.g. renaming
  `confirmed` → `booked`).
- Reordering tuple members, changing literal-union members, etc.

---

## 4. Zod schemas

- One file per domain area under `src/schemas/`. Co-locate the
  schema, the inferred input type, and the inferred output type
  in the same file.
- Use `z.infer<typeof X>` to derive TS types. **Do not** maintain a
  parallel hand-written `interface` for the same shape.
- Use `z.strict()` (or `.strip()`) at the request-boundary schemas
  to reject unknown keys. Internal models can be lenient.
- For every enum-like field, define the literal union **here** (in
  `src/constants/`) and reference it from the schema. Don't redeclare
  the union inside the schema.
- Branded IDs (e.g. `BookingId`) are validated with
  `z.string().uuid().brand<'BookingId'>()`. Helpers to construct
  them live in `src/utils/ids.ts` and are the only sanctioned way
  to mint one.

### Naming

- **Input schemas** (what the client sends): `createBookingInput`,
  `updateServiceInput`, `loginInput`.
- **Output schemas** (what the API returns): `booking`, `service`,
  `queueSnapshot`. The API wraps responses in an envelope; the
  envelope is in `src/types/api.ts`.
- **Patch / partial schemas**: prefix with `patch`, e.g.
  `patchServiceInput` uses `.partial()`.
- Schemas are PascalCase-free: they are values, not types. File
  names are `kebab-case.ts`.

---

## 5. Constants

- **Error codes** live in `src/constants/errors.ts` as
  `export const ErrorCodes = { SlotFull: 'SLOT_FULL', ... } as const;`
  and an `ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes]`
  union. Schemas reference these constants; the API throws with
  them; the web branches on them.
- **Status enums** (booking status, queue event names) follow the
  same `as const` + union pattern.
- **Limits** (max slots/day, default reminder lead time) live in
  `src/constants/limits.ts` and are **the only place** those
  numbers are written. Both apps import the constant.

---

## 6. Utilities

- Functions in `src/utils/` must be **pure**: same input → same
  output, no I/O, no clock reads, no randomness that isn't
  injected.
- Side-effecting helpers (the few that exist) live in clearly-
  named files: `src/utils/clock.ts` is the _only_ place that
  calls `new Date()`. Tests can swap it.
- Time helpers operate on `Date` objects in UTC and expose
  `Asia/Manila` formatting as a separate function. The web formats
  for display; the API keeps storage in UTC.
- Phone helpers **only** do PH numbers (`+63` / `09...`). Don't
  generalize to international until the product requires it.
- The `Result<T, E>` helper is a discriminated union, not an
  exception-throwing type. The API's services use it for expected
  failure modes (slot full, business closed); they still throw
  NestJS exceptions at the controller boundary.

---

## 7. What does **not** live here

- Anything that imports from a framework. If a helper exists for
  React, it lives in `apps/web`; if for Nest, it lives in `apps/api`.
- Anything that needs a real database, network, or filesystem.
- Anything that holds process-wide state (a logger, a cache, a
  client). Those are wired in the app that owns the resource.
- Generated code from Prisma. Prisma types stay in `apps/api`; the
  shared package defines the **public** shape of those models
  (which may intentionally be a subset).

---

## 8. Testing

- Every utility and every schema gets a unit test in
  `src/__tests__/`.
- For schemas, write tests for:
  - happy path
  - each rejection rule (one test per failure mode)
  - boundary values (empty string, max length, etc.)
- For utilities, write tests for the contract, not the
  implementation. If you rename an internal helper, the tests
  shouldn't break.
- A change that ships without a test is treated like a change
  without docs: it lands, but the next reviewer will send it back.

---

## 9. Don'ts

- Don't import from `next`, `react`, `@nestjs/*`, `@prisma/*`,
  `bullmq`, or any I/O library. If you need to, you are in the
  wrong workspace.
- Don't export a value that is mutable. Constants are `as const`
  or `Readonly<>`.
- Don't put a `default` export. Named exports only — they make
  refactors and tree-shaking behave.
- Don't put business rules in this package (e.g. "max 30 slots
  per day"). The shared package defines **shapes and limits**;
  the apps define **policy**.

---

## 10. Common tasks

- **Add a new API endpoint** → first define the input and output
  schemas here, then the API and the web both import them. The
  types flow out via `z.infer<...>`.
- **Add a new field to a model** → add it to the Zod output schema
  here, then to the Prisma model, then to the API response builder,
  then to the web consumer. The shared change is the first step.
- **Add a new error code** → add to `ErrorCodes` in
  `src/constants/errors.ts`, then to the API's service that throws
  it, then to the web's error mapper in `lib/api.ts`. The shared
  change is the first step.
- **Add a new utility** → put it in `src/utils/<topic>.ts` with a
  matching `__tests__/utils/<topic>.test.ts`. Don't bury it in a
  file with an unrelated name.
