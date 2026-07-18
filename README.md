# Takda 🕒

Takda is a high-volume, low-friction **queue and appointment booking platform designed specifically for walk-in businesses** in the informal service economy. It caters to businesses where the queue itself is the main interaction model and the focus is on immediate, in-person service.

Unlike traditional booking tools (e.g., Calendly or Square Appointments) designed for scheduled, pre-paid professional services booked far in advance, Takda is built for high-volume, same-day, walk-in-heavy businesses where speed and low-friction access are critical.

---

## 🚀 Core Flow

1. **Setup & Capacity**: A business owner registers and configures their daily slot limits and operational hours (e.g., _"30 slots per day, 1 slot every 5 minutes, open 8:00 AM – 5:00 PM"_).
2. **Easy Access**: Customers scan a QR code at the physical storefront or open a shared link on their mobile device (no native app install required).
3. **Frictionless Booking**: The customer selects a slot, enters their name and phone number, and confirms.
4. **SMS Reminders**: The system schedules and sends an automated SMS reminder before their slot starts.
5. **Live Queue Management**: The business owner views a real-time queue dashboard where they can manage arrivals, log walk-ins manually, and track no-shows/cancellations.

---

## 🛠️ Tech Stack & Architecture

Takda is structured as a monorepo managed with [turbo.json](file:///C:/Users/giomj/OneDrive/Desktop/takda/turbo.json) and [pnpm-workspace.yaml](file:///C:/Users/giomj/OneDrive/Desktop/takda/pnpm-workspace.yaml).

- **Frontend**: Next.js 16 (App Router) with Tailwind CSS 4, shadcn/ui, and Motion.
- **Backend**: NestJS 11 REST & WebSocket API, Prisma ORM, and PostgreSQL.
- **Job Queue & Real-Time**: BullMQ + Redis for SMS queuing and task processing, WebSockets for real-time live queue updates.
- **Contract/Validation**: Zod 4 for shared schema validation between frontend and backend.

---

## 📂 Repository Layout

- **[apps/web](file:///C:/Users/giomj/OneDrive/Desktop/takda/apps/web)**: Next.js customer PWA and owner dashboard.
- **[apps/api](file:///C:/Users/giomj/OneDrive/Desktop/takda/apps/api)**: NestJS API server.
- **[packages/shared](file:///C:/Users/giomj/OneDrive/Desktop/takda/packages/shared)**: Shared TS types, Zod schemas, and utilities.

For comprehensive guidelines, domain language, and developer rules, see the project-wide **[AGENTS.md](file:///C:/Users/giomj/OneDrive/Desktop/takda/AGENTS.md)**.

---

## 🛠️ Setup

Make sure you have the following installed locally:

- Node.js (v18+)
- **pnpm** (preferred package manager)
- PostgreSQL
- Redis

### Setup

1. **Install dependencies**:

   ```bash
   pnpm install
   ```

2. **Configure Environment Variables**:
   Copy the respective template configurations to `.env` files:
   - For web: [apps/web/.env.example](file:///C:/Users/giomj/OneDrive/Desktop/takda/apps/web/.env.example) to `apps/web/.env`
   - For api: [apps/api/.env.example](file:///C:/Users/giomj/OneDrive/Desktop/takda/apps/api/.env.example) to `apps/api/.env`

3. **Start Development Servers**:

   ```bash
   pnpm dev
   ```

   This command starts the NestJS API server, the Next.js web application, and all development tasks concurrently using Turborepo.

---

## 📖 Domain Glossary

To ensure alignment across the repository, we use these standard terms:

- **Tenant**: One deployment of Takda (single-tenant-per-deployment for v1).
- **Business**: A walk-in business (e.g., a specific shop or stall).
- **Service**: A bookable offering (e.g., _"Haircut"_).
- **Slot**: A bookable unit of capacity.
- **Booking**: A reservation of a slot by a customer.
- **Queue Position**: A customer's ordinal position among today's confirmed bookings.
- **Reminder**: An SMS reminder sent to the customer before their slot.
- **Walk-in**: A customer added directly to the live queue manually by the owner.
