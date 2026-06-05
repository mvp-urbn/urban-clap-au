@AGENTS.md

---

# Urban Clap AU — Project Context

> **How to use this file:** Read it at the start of every session to get full context. Update the **Session Log** section at the bottom before ending each session.

---

## What This Project Is

A mobile-first MVP clone of Urban Company, built for the **Australian market**. Goal: prove demand for a fixed-price, tiered home services booking platform. The only live category is **Home Cleaning** — Lawn Mowing, Dog Wash, and Handyman are visible but greyed out as coming-soon teasers.

The backend is a "Wizard of Oz" model — things that look automated to users are triggered manually by an admin via the dispatch console.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router), TypeScript |
| Styling | Tailwind CSS v4, `clsx`, `tailwind-merge` |
| Icons | Lucide React |
| Database / Auth | Supabase (PostgreSQL + RLS) |
| Payments | Stripe Test Mode — `stripe` Node SDK + `@stripe/react-stripe-js` |
| SSR Auth | `@supabase/ssr` (browser + server clients) |

---

## Project Location

```
/Users/2018imac/MVP FOR URBAN CLAP /urban-clap-au/
```

The parent directory name has spaces and a trailing space — always quote paths in shell commands.

Run commands from project root:
```bash
npm run dev          # dev server
npx tsc --noEmit     # type check only
npm run build        # full production build (always validate with this)
```

---

## Directory Structure

```
src/
├── app/
│   ├── page.tsx                        # Marketing landing page
│   ├── layout.tsx                      # Root layout (Geist font, metadata, viewport)
│   ├── globals.css                     # Tailwind base + global resets
│   ├── book/page.tsx                   # 5-step booking funnel entry point
│   ├── admin/dispatch/
│   │   ├── page.tsx                    # Server component — admin auth guard
│   │   └── DispatchDashboard.tsx       # Client — job cards + SMS clipboard generator
│   ├── auth/
│   │   ├── login/page.tsx              # Sign in / Sign up
│   │   └── callback/route.ts           # Supabase OAuth code exchange
│   └── actions/bookings.ts             # Server actions: createPaymentIntent, confirmBooking, getPendingBookings
├── components/
│   ├── ui/
│   │   ├── Button.tsx                  # Reusable button (variants + isLoading spinner)
│   │   ├── CounterInput.tsx            # +/- counter with min/max guards
│   │   └── StepIndicator.tsx           # 5-step progress bar
│   └── booking/
│       ├── StepCategory.tsx            # Step 1: service category tiles
│       ├── StepScope.tsx               # Step 2: bedroom + bathroom counters
│       ├── StepTier.tsx                # Step 3: Silver / Gold / Pro cards
│       ├── StepSchedule.tsx            # Step 4: date picker, time slots, address
│       └── StepCheckout.tsx            # Step 5: summary + Stripe Elements + success
├── context/BookingContext.tsx          # React context — all 5-step form state
├── hooks/usePricingCalculator.ts       # usePricingCalculator hook + calculatePrice() fn
├── lib/
│   ├── utils.ts                        # cn() = clsx + tailwind-merge
│   ├── stripe.ts                       # Stripe server-side client
│   └── supabase/
│       ├── client.ts                   # createBrowserClient
│       └── server.ts                   # createServerClient (reads Next.js cookies)
└── types/index.ts                      # All shared types, enums, tier constants

supabase/schema.sql                     # Full DB migration — run once in Supabase SQL Editor
```

---

## Database Schema (Supabase)

**`profiles`** — mirrors `auth.users`. Auto-created via trigger on signup.
- `id` (uuid PK → auth.users), `role` (enum: customer/contractor/admin), `full_name`, `phone_number`, `postcode`

**`services`** — seeded with 3 rows (Silver/Gold/Pro Home Cleaning).
- `base_price_cents` = 6900 ($69 AUD)

**`bookings`** — core transaction table.
- `status` enum: `pending_dispatch | assigned | completed | cancelled`
- `total_price_cents`, `stripe_payment_intent_id`, `assigned_contractor_id` (nullable)

**RLS rules:** Customers see only their own bookings. Admins see/update all. Services are public. `is_admin()` SQL function used in all admin policies.

---

## Pricing Logic

All arithmetic in **integer cents** — display strings generated only at render time.

```
total_cents = (6900 + bedrooms × 3500 + bathrooms × 2500) × tier_multiplier
```

| Tier | Multiplier |
|---|---|
| Silver | 1.0× |
| Gold | 1.4× |
| Pro | 1.8× |

- GST is **included** in displayed prices (AU standard). GST component = `total / 11`.
- Contractor payout = 80% of total.
- Currency format: `Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' })`.
- Use `usePricingCalculator(bedrooms, bathrooms, tier)` in components.
- Use standalone `calculatePrice(bedrooms, bathrooms, tier)` inside `.map()` (hooks can't be called there).

---

## 5-Step Booking Funnel

State is held in `BookingContext` — no data lost when navigating between steps.

| Step | Component | Key state written |
|---|---|---|
| 1 | StepCategory | (confirms selection, advances) |
| 2 | StepScope | `bedrooms`, `bathrooms` |
| 3 | StepTier | `tier`, `totalPriceCents` |
| 4 | StepSchedule | `date`, `timeSlot`, `address`, `suburb`, `postcode` |
| 5 | StepCheckout | Creates PaymentIntent → on success calls `confirmBooking()` → writes booking to DB |

---

## Admin Dispatch Console (`/admin/dispatch`)

- Server component checks `role === 'admin'`, redirects non-admins.
- Lists all `pending_dispatch` bookings.
- Each card: customer name, suburb, datetime, tier, contractor earn (80%).
- "Generate SMS Dispatch" copies pre-formatted clipboard text:
  > `URGENT JOB: Gold Clean in Bondi. Sat 10am. Earn $144.00 AUD. Reply YES to claim. Call: [PHONE]`
- Refresh button re-fetches without page reload.

---

## Environment Variables (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=
```

---

## Key Patterns & Gotchas

- **Supabase client in 'use client' components** — call `createClient()` inside the handler/submit function, not at module or render level. Prevents prerender failures when env vars aren't available at build time.
- **`export const dynamic = 'force-dynamic'`** — add to any page that calls Supabase client-side and must not be statically prerendered.
- **Stripe API version** pinned to `'2026-05-27.dahlia'` in `src/lib/stripe.ts` — update if upgrading the Stripe SDK.
- **`calculatePrice` vs `usePricingCalculator`** — use the standalone function inside array maps; use the hook inside component bodies only.
- **Tailwind v4** is used — some v3 utilities may behave differently. Use `@import "tailwindcss"` not the old `@tailwind` directives.

---

## Design System

- **Brand color:** `emerald-600` (primary actions, logo, active states)
- **Tier colors:** Silver = slate, Gold = amber, Pro = violet
- **Border radius:** `rounded-xl` for inputs/small elements, `rounded-2xl` for cards
- **Mobile-first:** Design for 375px, scale up with `sm:` breakpoints
- **No code comments** unless the WHY is non-obvious to a future reader

---

## Session Log

> Add an entry here at the **end of every session**. Be specific — what was built, what was tested, what's next.

### 2026-06-04 — Session 1: Full initial build

**Built:**
- Next.js 16 project scaffolded with TypeScript, Tailwind v4, Lucide, Supabase SSR, Stripe
- `supabase/schema.sql` — full migration with profiles, services, bookings tables, RLS, trigger, seeded tiers
- `BookingContext` — 5-step form state management
- `usePricingCalculator` — integer-cent pricing engine with GST and contractor payout
- All 5 booking step components (Category → Scope → Tier → Schedule → Checkout)
- Stripe Elements checkout + `createPaymentIntent` / `confirmBooking` server actions
- Admin Dispatch Dashboard with SMS clipboard generator
- Marketing landing page (`/`) and auth page (`/auth/login`)
- `npm run build` passes cleanly — zero TypeScript errors

**Not yet built (next priorities):**
1. Stripe webhook handler (`/api/webhooks/stripe`) to auto-update booking status on payment
2. "My Bookings" page for customers to view past and upcoming bookings
3. Email confirmation to customer after booking confirmed
4. Supabase Realtime subscription in admin dashboard (auto-refresh on new pending jobs)
5. Contractor-facing job accept/reject flow
6. Production deployment to Vercel + Supabase production project
7. Postcode-based service area validation (currently accepts any AU postcode)
