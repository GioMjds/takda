# AGENTS.md - Takda Web (apps/web)

> This file is **in addition to** the root [AGENTS.md](../../AGENTS.md).
> Read the root first — it has the monorepo rules, toolchain, and
> domain language. This file covers only what is specific to the web app.

This workspace is the **Next.js 16 App Router** app. It serves two very
different audiences from one codebase:

- **Customers** — a public, no-install PWA reachable by scanning a QR
  code or opening a shared business link. Fast, mobile-first, in
  Tagalog/English/Filipino, low-bandwidth.
- **Owners / staff** — a logged-in dashboard for configuring services,
  capacity, and watching the live queue.

---

## 1. Stack snapshot

| Concern           | Choice                                                            |
| ----------------- | ----------------------------------------------------------------- |
| Framework         | Next.js 16 (App Router, RSC)                                      |
| Language          | TypeScript (`strict`)                                             |
| UI primitives     | Tailwind 4 + shadcn/ui                                            |
| Animation         | `motion` (Framer Motion successor)                                |
| Forms             | `react-hook-form` + Zod resolver                                  |
| Client state      | `zustand` (small, per-feature stores)                             |
| Loading states    | `react-loading-skeleton`                                          |
| Data fetching     | Native `fetch` + RSC; SWR/TanStack-Query only if we add one (TBD) |
| Validation source | `@takda/shared` (Zod schemas)                                     |
| PWA / install     | Web App Manifest + service worker                                 |

---

## 2. Directory layout

```folder
apps/web/
├── app/                      # App Router routes
│   ├── (marketing)/          # public landing, "what is Takda"
│   ├── (customer)/           # QR-code landing → book → confirm
│   │   └── [businessSlug]/
│   │       ├── page.tsx          # service list
│   │       ├── book/page.tsx     # slot picker
│   │       └── confirm/page.tsx  # post-booking confirmation
│   ├── (owner)/              # authenticated owner area
│   │   ├── dashboard/page.tsx    # live queue
│   │   ├── services/             # CRUD services + capacity
│   │   └── settings/             # business profile, QR code, hours
│   ├── api/                  # BFF routes only (thin proxies / webhooks)
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                   # shadcn-generated primitives
│   ├── customer/             # customer-only components
│   └── owner/                # owner-only components
├── lib/
│   ├── api.ts                # typed fetch wrapper against the Nest API
│   ├── auth.ts               # session helpers
│   └── format.ts             # date/time in PH locale, peso, etc.
├── stores/                   # zustand stores (one per feature)
├── public/
├── next.config.ts
├── tailwind.config.* (or v4 css-first config)
└── tsconfig.json             # extends ../../tsconfig.json
```

Use **route groups** (`(customer)`, `(owner)`) to keep layouts separate
without polluting the URL.

---

## 3. Routing conventions

- **Server Components by default.** Add `"use client"` only when the
  component needs state, effects, browser APIs, or event handlers.
- Co-locate route-specific components inside the route folder
  (`app/(customer)/[businessSlug]/book/_components/`) instead of
  promoting them to `components/` prematurely.
- Every dynamic route that points to a business **must** validate the
  slug server-side (call `@takda/shared` slug schema before rendering).
  Never trust URL params in the rendered tree without a check.
- Public routes are under `(customer)/[businessSlug]/...`; everything
  under `(owner)/...` requires a session. The `(owner)` layout enforces
  auth — don't duplicate the check in each page.

---

## 4. PWA rules (customer side)

- The customer flow **must** work without an app install, but must
  become installable on second visit. That means:
  - A valid `manifest.webmanifest` with `name`, `short_name`, `icons`
    (192, 512, maskable), `start_url`, `display: "standalone"`.
  - A service worker that precaches the app shell and serves the
    booking pages offline **as a last resort** (network-first with
    cache fallback). Booking is a write, so the SW must never serve
    stale POSTs.
  - No popup that begs for install. Use the browser's own prompt.
- All customer-side pages must be **mobile-first**, and tested at
  360×640 (entry-level Android) before adding a desktop layout.
- All copy has a Filipino/Tagalog variant. Strings live in a single
  dictionary (no inline Tagalog) so we can audit phrasing. Keep it
  short — palengke customers are not reading paragraphs.

---

## 5. Forms & validation

- All forms use `react-hook-form` + `@hookform/resolvers/zod`.
- The Zod schema is **always imported from `@takda/shared`**, never
  redeclared in the web app. If you find yourself writing a Zod schema
  for a shape that the API also uses, **add it to shared first**.
- Phone number input uses a PH-specific format
  (`+639XXXXXXXXX` or local `09XXXXXXXXX`). The shared schema enforces
  this; do not relax it client-side to "make the form submit".
- Submit buttons stay disabled while `formState.isSubmitting` is true.
  Don't fake-disable with CSS.

---

## 6. Data fetching against the API

- `lib/api.ts` is the **only** place that knows the API base URL,
  auth headers, and error shape. Pages and components import the
  typed functions from there, never raw `fetch`.
- API errors are normalized to a single `{ code, message, details? }`
  shape (matches the Zod schema in `@takda/shared`). The `api.ts`
  wrapper throws on non-2xx so pages can `try/catch` and render
  `app/error.tsx`.
- The owner dashboard subscribes to the live queue over the API's
  WebSocket. Don't poll. If you find yourself adding `setInterval`,
  ask whether this should be a server push instead.
- Never put API URLs in components. If a URL is long, name the route
  in the API package and reference the constant.

---

## 7. State management

- **Server state** stays on the server. RSC + revalidation is the
  default. Reach for client state only when you have to.
- **Client state** lives in `zustand` stores under `stores/`. One store
  per feature (`useBookingDraftStore`, `useOwnerQueueStore`, ...). Do
  not create a single global `useStore`.
- Don't put derived data in state. Compute it from props or use
  memoized selectors.
- Local component state (`useState`) is fine for one-off UI state
  (modals, hover, etc.).

---

## 8. Styling

- Tailwind 4, utility-first. No `@apply` for layout — keep classes
  on the element so it's obvious at a glance.
- shadcn/ui primitives live in `components/ui/`. Don't hand-roll
  buttons / dialogs / dropdowns that shadcn already provides.
- Color tokens come from the Takda design palette (see
  `globals.css`). If a new color is needed, add a token, don't use a
  raw hex.
- Money is always rendered with `Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })`. Use `lib/format.ts`; never `₱{x}` in JSX.
- Dates/times are in the Asia/Manila timezone. Render with
  `Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', ... })`
  in `lib/format.ts`. **Never** call `new Date().toLocaleString()` inline.

---

## 9. Performance & accessibility

- The customer landing page (the QR-code target) is the hottest page
  in the system. It must be:
  - ≤ 100 KB of JS on first load
  - LCP < 2.5s on a mid-range Android over 3G
- Images: use `next/image` with `sizes` set. The QR-code-target pages
  rarely need images at all.
- Accessibility: every interactive element has a visible focus state
  (Tailwind's `focus-visible:ring-...`). All form inputs have a
  `<label>`. Color contrast ≥ 4.5:1 (we are not a dark UI; don't pick
  pastels for body text).
- Animations respect `prefers-reduced-motion`. Motion components
  accept a `reducedMotion="user"` prop — use it.

---

## 10. Testing

- Unit tests for utility functions: `*.test.ts` next to the file.
- Component tests with React Testing Library + Vitest/Jest
  (whichever the app's stack already has — check `package.json`
  before adding a runner).
- Always include at least one **a11y** assertion in component tests
  (`getByRole`, `getByLabelText`, not `getByTestId`).
- E2E (Playwright, if added later) lives at the repo root or under
  `apps/web/e2e/`. Don't bury it inside `app/`.

---

## 11. Don'ts

- Don't add Redux, Recoil, MobX, or any state lib other than zustand.
- Don't add a CSS-in-JS lib. Tailwind 4 is the system.
- Don't `localStorage` anything customer-side without an expiry and a
  schema-version key — phones get cleared, customers reinstall browsers.
- Don't ship a feature flag system unless we're already using one
  across the monorepo.
- Don't `dangerouslySetInnerHTML` for customer-facing strings. The
  PWA must be safe in any context a QR code can put it in.

---

## 12. Common tasks

- **Add a new public route** → create under `app/(customer)/...`,
  add a `loading.tsx` and `error.tsx` at the same level.
- **Add a new owner route** → create under `app/(owner)/...`. The
  group layout already guards auth; you don't need to re-check.
- **Add a new form** → grab the Zod schema from `@takda/shared`,
  wire `react-hook-form` + `zodResolver`, write a submit handler in
  `lib/api.ts` if the call doesn't exist yet, then write the page.
- **Add a new shadcn component** → `pnpm dlx shadcn@latest add <name>`
  into `components/ui/`. Don't import it from somewhere else.
