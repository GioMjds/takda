# AGENTS.md - Takda (Monorepo Root)

> This file is the source of truth for the monorepo. Every workspace
> `AGENTS.md` (apps/web, apps/api, packages/shared) inherits from here.
> Read this first; then read the workspace file for the area you're editing.

---

## 1. What is Takda?

Takda is a **queue and appointment booking platform for walk-in businesses**
targeted at the informal service economy — palengke (public market) stalls,
barbershops, small dental/optical clinics, LGU (local government unit)
offices, and the like.

**Core flow:**

1. A business owner registers and configures their **capacity / slots**
   (e.g. "30 slots per day, 1 slot every 5 minutes, open 8am–5pm").
2. Customers **scan a QR code** at the storefront (or open a shared link).
3. The customer picks a slot, enters a name + phone number, and books.
4. The system sends a **SMS reminder** before the slot.
5. The owner sees a **live queue** for the day, can mark arrivals,
   no-shows, and walk-ins.

**Why this product, not Calendly / Square Appointments:**
those tools are designed for scheduled professional services in Western
markets (one booking = one paid appointment, far in advance). Takda targets
high-volume, low-friction, same-day, walk-in-heavy businesses where the
queue itself is the product.

**Non-goals (do not add these without a discussion):**

- native mobile apps — customers use the PWA / web link
- payments / tipping (out of scope for v1)
- multi-tenant SaaS billing flows (we are a single-tenant-per-deployment
  product, multi-business per tenant)

---

## 2. Repository layout

```folder
takda/
├── apps/
│   ├── web/        # Next.js 16 App Router — customer PWA + owner dashboard
│   └── api/        # NestJS 11 REST + WebSocket API + Prisma + Postgres
├── packages/
│   └── shared/     # Zod schemas, shared TS types, shared utilities
├── turbo.json      # Turborepo task pipeline
├── pnpm-workspace.yaml
├── tsconfig.json   # root TS config (strict); @takda/shared path alias
├── .prettierrc     # formatting (2 spaces, single quotes, trailing commas, LF)
└── AGENTS.md       # ← you are here
```

Workspaces are wired through `pnpm-workspace.yaml` (`apps/*` + `packages/*`)
and orchestrated by **Turborepo**.

### Module names (use these in code, not `apps/web`)

| Workspace         | Package name    | Imported as                           |
| ----------------- | --------------- | ------------------------------------- |
| `apps/web`        | `@takda/web`    | (Next app, not imported)              |
| `apps/api`        | `@takda/api`    | (Nest app, not imported)              |
| `packages/shared` | `@takda/shared` | `import { ... } from '@takda/shared'` |

The `@takda/shared` path alias is defined in the root `tsconfig.json` and
re-declared in each app's `tsconfig.json`. Add new shared exports there.

---

## 3. Tooling (use exactly these versions / commands)

| Concern         | Tool                                  | Notes                                   |
| --------------- | ------------------------------------- | --------------------------------------- |
| Package manager | **pnpm** (workspaces)                 | `pnpm install` from root.               |
| Task runner     | **Turborepo**                         | `pnpm dev`, `pnpm build`, `pnpm test`.  |
| Language        | **TypeScript** (`strict: true`)       | No `any` in app/shared code.            |
| Format          | **Prettier** (root `.prettierrc`)     | Run before committing.                  |
| Lint            | **ESLint 9 (flat config)**            | Per-app configs under each `apps/*`.    |
| Web framework   | **Next.js 16** (App Router)           | `apps/web`                              |
| API framework   | **NestJS 11**                         | `apps/api`                              |
| ORM / DB        | **Prisma 7 + Postgres**               | Schema lives in `apps/api/prisma/`.     |
| Queue / jobs    | **BullMQ + Redis**                    | SMS reminders, no-show follow-ups.      |
| Real-time       | **WebSockets (`@nestjs/websockets`)** | Live queue updates to owner dashboard.  |
| Validation      | **Zod 4** (via `@takda/shared`)       | Single source of truth for shapes.      |
| Web UI          | **Tailwind 4**, shadcn, motion        | `apps/web`.                             |
| Web state       | **Zustand** + **react-hook-form**     | `apps/web`.                             |
| Web PWA         | `next-pwa` or App Router manifest     | Customers install the site, not an app. |
| SMS             | Provider TBD (Semaphore / Twilio PH)  | Behind a `NotificationsService`.        |

---

## 4. Universal rules (apply in every workspace)

### 4.1 TypeScript

- `strict: true` is on. No `any`, no `// @ts-ignore`. Use `unknown` and narrow.
- Prefer `type` over `interface` for plain data shapes; use `interface` for
  classes and NestJS DI tokens.
- Imports of `@takda/shared` go through the alias, never via relative path.
- Do not add new top-level dependencies without first checking the root
  `package.json`. If it must live in only one app, add it to that app's
  `package.json` — not the root.

### 4.2 Code style

- Prettier config is the source of truth. Don't fight it. Run
  `pnpm exec prettier --write .` before committing.
- 2-space indent, single quotes, trailing commas, LF line endings.
- File names: `kebab-case.ts` for regular files, `PascalCase.tsx` for React
  components (Next.js convention).
- One responsibility per file. If a file passes 300 lines, it almost
  certainly needs to be split.

### 4.3 Git

- Branch names: `<type>/<short-kebab-summary>` — e.g.
  `feat/owner-dashboard`, `fix/sms-reminder-dedupe`.
- Commit messages: imperative mood, ≤72-char subject, body explains _why_.
  Reference the issue / ticket ID when one exists.
- Don't commit `.env*` files. They are in `.gitignore`; keep them that way.
- Don't commit `pnpm-lock.yaml` churn from a one-off `pnpm add` you didn't
  mean to keep — review the diff before staging.

### 4.4 Definition of done (any non-trivial change)

A change is "done" only when **all** of these are true:

1. It builds: `pnpm build` at the root passes.
2. It typechecks: `pnpm typecheck` (or the app's own script) passes.
3. It lints: `pnpm lint` passes for the touched workspace(s).
4. It has tests for behavior it adds or changes (see §5).
5. It does not regress an existing test, typecheck, or build.
6. It does not introduce a TODO without an owner and a target date.

---

## 5. Testing

- **Unit tests** live next to the code (`*.spec.ts` for Nest, `*.test.ts`
  for shared/utility code, `*.test.tsx` for React components).
- **Integration tests** for the API live in `apps/api/test/`.
- A change without a test for new behavior will be sent back. The test
  does not need to be elaborate; even a "happy path + one failure mode"
  is enough for a first pass.
- Tests must run in CI without network calls. Mock SMS, Redis, and the DB
  in unit tests. Use the test DB only in `test:e2e`.

---

## 6. Domain model (the language we use)

These terms mean the same thing everywhere. Don't invent synonyms.

- **Tenant** — one deployment of Takda. (For v1, we ship one tenant per
  deployment; later this becomes "organization".)
- **Business** — a single walk-in business inside a tenant. The owner logs
  in here, the QR code points here.
- **Service** — a bookable offering of the business (e.g. "Haircut",
  "Stall #3 dry goods pickup"). A business has 1..N services.
- **Slot** — a single bookable unit of capacity for a service at a time.
- **Booking** — a customer's reservation of one slot. Has a `status`:
  `pending` → `confirmed` → `checked_in` / `no_show` / `cancelled`.
- **Queue position** — derived: the customer's ordinal position among
  today's `confirmed` bookings for a business, sorted by slot start time.
- **Reminder** — a scheduled SMS job tied to a booking, sent T-X minutes
  before the slot.
- **Walk-in** — a customer served without a booking; the owner adds them
  to the queue manually so capacity tracking stays honest.

All of these have Zod schemas in `packages/shared` and Prisma models in
`apps/api/prisma/schema.prisma`. The Zod schema is the API contract; the
Prisma model is the storage contract; do not let them drift silently.

---

## 7. Cross-workspace contract

- `packages/shared` is the **only** workspace other code may import from
  by name. (`@takda/web` and `@takda/api` may not import each other.)
- Anything exported from `@takda/shared` must be **tree-shakeable** and
  must not pull in Node-only or browser-only modules at the top level.
  If a util needs Node APIs, put it behind a `*.server.ts` or `*.client.ts`
  suffix and document which side may import it.
- **Bumping the shared contract is a breaking change** for the API and the
  web together. Update both in the same PR.

---

## 8. Environment & secrets

- Local dev: copy `.env.example` (if present) to `.env` in each app.
  Real secrets never go in the repo.
- Required services in dev: Postgres, Redis, an SMS provider key.
- The API reads `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, and the SMS
  provider key from `process.env`. The web reads `NEXT_PUBLIC_API_URL`.
  Anything that must reach the browser is `NEXT_PUBLIC_*`; anything else
  stays server-side.

---

## 9. When you're stuck

- Read the workspace `AGENTS.md` for the file you're editing — most
  area-specific rules live there, not here.
- Search before you ask: a quick `Grep` for the symbol often surfaces the
  pattern we already use.
- If you find yourself wanting to add a new dependency, framework, or
  pattern that isn't already in the repo, surface it before writing code.
  Takda's stack is deliberately small.

---

## 10. Pointers to workspace AGENTS.md

- [apps/web/AGENTS.md](./apps/web/AGENTS.md) — Next.js customer PWA + owner dashboard
- [apps/api/AGENTS.md](./apps/api/AGENTS.md) — NestJS API, Prisma, BullMQ, WebSockets
- [packages/shared/AGENTS.md](./packages/shared/AGENTS.md) — Zod schemas, shared types, shared utils
