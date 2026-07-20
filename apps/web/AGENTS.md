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
| Loading states    | `react-loading-skeleton` + `shadcn`'s Skeleton UI component       |
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
│   └── app/globals.css       # Tailwind 4 CSS-first config (@import 'tailwindcss')
└── tsconfig.json             # extends ../../tsconfig.json
```

Use **route groups** (`(customer)`, `(owner)`) to keep layouts separate
without polluting the URL.

---

## 3. Routing & Separation of Concerns

- **Server Components by default.** Add `"use client"` only when the component needs state, effects, browser APIs, or event handlers. Keep data fetching and layouts strictly server-side where possible.
- **Separation of concerns via `/pages/<route-name>`**: Route files under `app/[lang]/...` (e.g. `page.tsx`, `layout.tsx`, `template.tsx`) must serve only as routing wrappers. The presentation layer, hooks, and API calls must be organized inside `pages/<route-name>/`.
  - Inside `pages/<route-name>/`, folders are structured as:
    - `hooks/`: Page-specific custom hooks (e.g., react-hook-form setups, local state hooks, custom effects).
    - `api/`: API fetch files calling endpoints configured in `configs/fetch.ts`, named after the HTTP method (e.g., `GET.ts`, `POST.ts`, `PUT.ts`, `DELETE.ts`).
    - `sections/`: UI layout sections and sub-components specific to this route.
    - `index.ts`: Barrel file exporting views, hooks, and sections.
  - Mirrored routing mapping (mirroring folders in `app/`):
    - `app/[lang]/page.tsx` $\rightarrow$ `pages/[lang]/` (Home page)
    - `app/[lang]/(auth)/login/page.tsx` $\rightarrow$ `pages/[lang]/login/`
    - `app/[lang]/(customer)/b/[businessSlug]/page.tsx` $\rightarrow$ `pages/[lang]/b/[businessSlug]/`
    - `app/[lang]/(customer)/b/[businessSlug]/confirm/page.tsx` $\rightarrow$ `pages/[lang]/b/[businessSlug]/confirm/`
    - `app/[lang]/(onboarding)/onboarding/page.tsx` $\rightarrow$ `pages/[lang]/onboarding/`
    - `app/[lang]/(owner)/dashboard/page.tsx` $\rightarrow$ `pages/[lang]/dashboard/`

- **Typecheck & Typed Routes**: Always run typecheck via `pnpm typecheck` inside the `web` workspace to check typed routes and link path correctness. Do not use the root turbo scripts if you want to run workspace scripting directly.

- **Standard Props Typing**:
  - Always type page files using the globally available `PageProps<TRoute>` and layout files using `LayoutProps<TRoute>`. Next.js typegen automatically infers parameters and searchParams from the route path provided as the generic argument.
  - Due to Next.js 15/16 rendering updates, `params` and `searchParams` are async and must be awaited before accessing:

    ```typescript
    // Example for app/[lang]/page.tsx
    export default async function HomePage({ params }: PageProps<'/[lang]'>) {
      const { lang } = await params;
      // ...
    }

    // Example for app/[lang]/layout.tsx
    export default async function RootLayout({
      children,
      params,
    }: LayoutProps<'/[lang]'>) {
      const { lang } = await params;
      // ...
    }
    ```

  - Map dynamic routes correctly by omitting route grouping folders from the route path argument (e.g., `PageProps<'/[lang]/login'>` for `app/[lang]/(auth)/login/page.tsx` and `PageProps<'/[lang]/b/[businessSlug]'>` for `app/[lang]/(customer)/b/[businessSlug]/page.tsx`).

- **Route Grouping**: Route groups (e.g. `(auth)`, `(customer)`, `(owner)`) are used to segregate layouts and route contexts. Every new route group created MUST define its own `layout.tsx`.
- **Template files (`template.tsx`)**: Use `template.tsx` only when you need Next.js to recreate the component instance on route change (e.g. triggering entrance/exit animations with Framer Motion, resetting local state, or executing a `useEffect` hook on navigation). Persistent elements like headers, navs, or sidebars should remain in `layout.tsx`.
- **Loading states (`loading.tsx`)**: Provide `loading.tsx` at key route levels to leverage React Streaming. Skeletons must be styled using **shadcn's Skeleton UI** primitives instead of spinner/fallback placeholders to match layout dimensions and reduce cumulative layout shift.
- **Not Found states (`not-found.tsx`)**: Add `not-found.tsx` to handle resource exceptions, particularly in dynamic routes. Call the Next.js `notFound()` utility function inside layout/page files when database checks fail or segment slugs are invalid.
- **Dynamic Segments**: Ensure proper type validation of dynamic route segments in `PageProps`. Every dynamic route that points to a business **must** validate the slug server-side (call `@takda/shared` slug schema before rendering). Never trust URL params in the rendered tree without a check.
- **Intercepting Routes**: Plan and implement relative (e.g., `(.)`) and parent-based (e.g., `(..)`) intercepting routes for rendering modals (e.g., slots selection or dashboard actions) inline with the current layout while preserving URL addressability and fallback direct routing.
- **Parallel Routes**: Use parallel route slots (e.g., `@modal`, `@tabs`) inside a layout file to render multiple views concurrently or conditionally in the same workspace layout.
- **Image & Link Optimization**:
  - Always use `next/image` with responsive `sizes` (e.g., `sizes="(max-width: 768px) 100vw, 33vw"`) and preset aspect-ratio configurations to avoid layout shifts.
  - Use `loading="lazy"` (Next.js default) for below-the-fold images to defer non-critical assets.
  - Use the `priority` attribute explicitly for above-the-fold elements (such as hero graphics or logo assets) to boost LCP scores.
  - Utilize `placeholder="blur"` (with static imports or a `blurDataURL` for dynamic assets) to deliver a polished visual loading state.
  - Always supply meaningful, screen-reader-friendly `alt` descriptions (avoid redundant words like "image" or "logo").
  - Always use `next/link` for internal transitions and ensure typed routing configs (`experimental.typedRoutes`) are active and valid.

- **SEO, Semantic HTML & Accessibility (ARIA)**:
  - Structural blocks must use semantic HTML5 elements (`<header>`, `<main>`, `<nav>`, `<section>`, `<article>`, `<footer>`, `<aside>`).
  - Maintain a single `<h1>` per page for search engine crawlers, preserving sequential, non-skipping heading flows (`<h2>` to `<h6>`).
  - Implement descriptive ARIA properties to expose active elements and states to screen readers (e.g., `aria-label`, `aria-describedby`, `aria-expanded` for toggles, and `aria-live="polite"`/`role="status"` for dynamic updates like queue statuses).
- **Directives Constraints**:
  - `'use client'`: Mark files containing hooks (`useState`, `useEffect`), event handlers, browser APIs, or animation libraries (e.g., `motion`).
  - `'use server'`: Restrict only to files or functions serving as entry points for Server Actions. Do not mix server actions inside client component files.
  - `'use cache'`: Utilize at database query or expensive calculation boundaries to cache server-rendered properties.
  - **Server-Side vs. Client-Side Page Components**: To ensure maximum SEO indexability and fast page loads, the main route page (`page.tsx`) and the top-level route barrel file (`pages/<route-name>/index.ts`) must remain **Server Components** by default.
  - **Integrating Animations & Transitions**: If a page requires transitions, page entrance animations, or hover micro-interactions via `motion`:
    - Do not mark the entire page as a Client Component.
    - Encapsulate the animated portions inside specific child components within `pages/<route-name>/sections/` and mark _only_ those sub-components with `'use client'`.
    - Import these animated sub-components back into the parent Server Component. This retains the semantic SEO structure on the initial server render while cleanly applying client-side animations after hydration.

- Public routes are under `(customer)/b/[businessSlug]/...`; everything under `(owner)/...` requires a session. The `(owner)` layout enforces auth — don't duplicate the check in each page.

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

## 8. Styling (Tailwind CSS v4 Rules & Warning Prevention)

- **CSS-First Engine & Config**:
  - Tailwind v4 uses CSS-first configuration via `@import 'tailwindcss';` in `app/globals.css`.
  - **Do NOT create or use legacy `tailwind.config.js` / `tailwind.config.ts`**. Custom theme tokens, font families, keyframes, and radii must be registered using `@theme inline` or `@theme` blocks inside `app/globals.css`.
  - Use `@variant dark (&:where(.dark, .dark *));` or standard media query variants for dark mode. **Do NOT use deprecated `@custom-variant` directives**, as they produce build-time compiler warnings in `@tailwindcss/postcss`.

- **Preventing Un-Updated Styles & Build Warnings**:
  - **No Dynamic String Interpolation for Class Names**: Tailwind v4 uses a static scanner to detect class names at build time. Never construct class names dynamically using template literals or string concatenation (e.g., `` className={`bg-${color}-500`} `` or `` text-${variant} ``). Dynamically generated classes cannot be detected by the scanner, causing styles to fail to compile or update. Always use complete literal strings or exhaustive lookup objects:
    ```typescript
    // BAD (Tailwind scanner misses these, styles won't update):
    const badgeColor = `bg-${variant}-100 text-${variant}-800`;

    // GOOD (Static literals recognized by Tailwind scanner):
    const variantStyles = {
      success: 'bg-emerald-100 text-emerald-800',
      warning: 'bg-amber-100 text-amber-800',
    };
    ```
  - **Avoid Deprecated `@apply` Directives**: Do not use `@apply` for layout classes or inside `@layer base`. Complex `@apply` declarations (especially modifier utility combinations like `@apply outline-ring/50;`) generate PostCSS compiler warnings and silent failures in v4. Use utility classes directly on elements or standard CSS declarations in `globals.css` (e.g. `border-color: var(--border);`).
  - **Scanning Shared Workspaces (`@source`)**: When referencing utility classes or components located in external workspace packages (e.g. `@takda/shared`), explicitly add `@source` directives in `globals.css` so the v4 compiler extracts all utility classes:
    ```css
    @source "../../packages/shared";
    ```
  - **PostCSS Setup**: `postcss.config.mjs` must use `@tailwindcss/postcss` exclusively (do not mix legacy `tailwindcss` PostCSS plugin configs).

- **Design Tokens & Theme Variables**:
  - Color tokens come from the Takda design palette in `app/globals.css` defined using OKLCH color spaces.
  - Custom theme variables in `:root` and `.dark` must be registered in `@theme inline` (`--color-primary: var(--primary);`, etc.). Never hardcode raw hex values directly in component files.
  - All surface and text contrast ratios must maintain $\ge 4.5:1$ for outdoor sunlight legibility.

- **Primitives & Formatting Guidelines**:
  - **shadcn/ui primitives**: Live in `components/ui/`. Don't hand-roll custom buttons, dialogs, or dropdowns when shadcn primitives exist.
  - **Currency formatting**: Money must always be rendered with `Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })` via `lib/format.ts`. Never hardcode `₱{x}` in JSX.
  - **Date & Time formatting**: Always format dates in `Asia/Manila` timezone using `lib/format.ts`. **Never** call `new Date().toLocaleString()` inline.

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
- Don't add verbose or unnecessary inline code comments when updating files — keep code clean, self-documenting, and comments minimal.

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

---

## 13. Design Context

This workspace is integrated with the **impeccable** visual design system.

- **Register**: `product` (UIs, admin dashboards, settings panels, table/list actions where task flow dominates).
- **Creative North Star**: "The Clean Canopy" (structured, refreshing, clean grids, organic teals).
- **Key Palette Colors**:
  - Primary: `#1A8C75` $\rightarrow$ `oklch(0.589 0.150 170.3)`
  - Accent: `#A8DDD4` $\rightarrow$ `oklch(0.868 0.087 175.4)`
  - Dark: `#0D4F43` $\rightarrow$ `oklch(0.395 0.098 171.7)`
  - Surface: `#F7FAFA` $\rightarrow$ `oklch(0.984 0.005 182.8)`
- **Key Resources**:
  - [PRODUCT.md](file:///C:/Users/giomj/OneDrive/Desktop/takda/apps/web/PRODUCT.md): Strategy, users, and core principles.
  - [DESIGN.md](file:///C:/Users/giomj/OneDrive/Desktop/takda/apps/web/DESIGN.md): Visual design guidelines and typographic pairing (Raleway sans-serif).
  - [.impeccable/design.json](file:///C:/Users/giomj/OneDrive/Desktop/takda/apps/web/.impeccable/design.json): Component schema sidecar metadata.
- **Sunlight Legibility**: All new surfaces must maintain a contrast ratio of $\ge$ 4.5:1 against the background to guarantee storefront legibility under bright outdoor sunlight.
