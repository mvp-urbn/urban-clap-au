# Urban Clap AU

A fixed-price, tiered home cleaning booking platform for the Australian market. Built as a lean "Wizard of Oz" MVP — customers book online, operations are handled manually via an admin dispatch console.

Production: **https://urban-clap-au.vercel.app**

---

## Project Status

| Portal Module | Current MVP Build State | Core Features Operational |
| :--- | :--- | :--- |
| **Customer Portal** | 🟩 **FULLY FUNCTIONAL** | Multistep service selection (Home Cleaning), address/postcode mapping, dynamic tiered pricing (Silver/Gold/Pro), Stripe checkout, booking history, star reviews. |
| **Admin Portal** | 🟩 **FULLY FUNCTIONAL** | Live dispatch console (`/admin/dispatch`) with Supabase Realtime auto-refresh, full admin dashboard (`/admin`) with revenue stats, filter tabs, inline status actions. |
| **Contractor Portal** | 🟥 **NOT BUILT YET** | Target area for next sprint. Needs onboarding compliance (ABN, insurance upload) and 3-step proof of work loop. |

---

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Supabase** — PostgreSQL, Auth, Row Level Security, Realtime
- **Stripe Elements** — payment scaffold (test mode)
- **Resend** — transactional email
- **Tailwind CSS v4**
- **Lucide React**

## Features

- 5-step booking funnel (category → tier → scope → schedule → checkout)
- Three service tiers: Silver, Gold, Pro with dynamic pricing
- Inline auth gate at checkout — booking state preserved across sign in
- Customer "My Bookings" dashboard with status tracking
- Star rating + review form on completed bookings
- PIN-protected admin dispatch console with SMS copy-paste workflow and Supabase Realtime auto-refresh
- Full admin dashboard with revenue stats, filter tabs, and inline status actions
- Test data seed endpoint for demo flow without Stripe

## Pricing

```
(base $69 + bedrooms × $35 + bathrooms × $25) × tier multiplier
Silver 1.0× · Gold 1.4× · Pro 1.8×
All prices AUD incl. GST
```

---

## Codebase Rules

1. **Do Not Break Existing Flows:** The customer checkout journey and current admin dashboard work perfectly. Do not rewrite, delete, or modify code in those active directories unless explicitly asked.
2. **Monetary Integer Rule:** All currency variables, margins, and pricing constants must be stored in the database exclusively as **integers representing cents** (e.g., $150.00 AUD = `15000`).
3. **State Machine Sequence:** Bookings must advance through this strict atomic state flow:
   `pending_dispatch` → `assigned` → `arrived` → `in_progress` → `completed` → `cancelled`

---

## Project Directory Structure

```text
src/
├── app/
│   ├── page.tsx                  # Landing page (Cleaning active, others greyed out)
│   ├── book/                     # 5-step booking funnel
│   ├── bookings/                 # Customer booking history & review flow
│   ├── auth/                     # Login, sign up, OAuth callback
│   │
│   ├── admin/                    # EXISTING: Administrative control deck
│   │   ├── page.tsx              # Full dashboard — stats, revenue, all bookings
│   │   ├── AdminDashboard.tsx    # Client component with filter tabs + status actions
│   │   ├── login/                # PIN entry page
│   │   └── dispatch/             # Live dispatch console with Realtime auto-refresh
│   │
│   ├── contractor/               # 🆕 TO BE BUILT: Isolated supply portal
│   │   ├── onboarding/           # ABN, identity, and insurance PDF uploading
│   │   ├── dashboard/            # Jobs available board & earnings metrics
│   │   └── jobs/
│   │       └── [id]/             # Live tracking: Geofence, Customer OTP, Before/After upload
│   │
│   └── api/                      # Stripe webhooks & backend route handlers
│
├── components/
│   ├── booking/                  # EXISTING: Booking funnel step components
│   ├── contractor/               # 🆕 TO BE BUILT: Geofence button, camera picker, OTP card
│   └── ui/                       # Shared design primitives
│
├── hooks/
│   ├── usePricingCalculator.ts   # EXISTING: Cent-integer pricing engine
│   └── useGeofence.ts            # 🆕 TO BE BUILT: navigator.geolocation distance utility
│
├── lib/
│   ├── supabase/                 # client.ts, server.ts, admin.ts
│   ├── resend.ts                 # Resend email client
│   └── stripe/                   # Stripe API config
│
└── types/
    └── index.ts                  # Shared TypeScript types and enums

supabase/
└── schema.sql                    # Full PostgreSQL schema + RLS policies
```

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create `.env.local` in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe (test mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Resend
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=bookings@yourdomain.com

# Admin
ADMIN_PIN=0045
```

### 3. Set up the database

Run `supabase/schema.sql` in the Supabase SQL Editor. Then run the reviews table migration:

```sql
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  customer_id uuid not null references auth.users(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now(),
  unique(booking_id)
);
alter table public.reviews enable row level security;
create policy "customers can insert own review" on public.reviews for insert with check (auth.uid() = customer_id);
create policy "customers can read own reviews" on public.reviews for select using (auth.uid() = customer_id);
create policy "customers can update own review" on public.reviews for update using (auth.uid() = customer_id);
grant all on public.reviews to service_role;
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Routes

| Route | Description |
|---|---|
| `/` | Marketing landing page |
| `/book` | 5-step booking funnel |
| `/bookings` | Customer bookings dashboard |
| `/auth/login` | Sign in / sign up |
| `/auth/callback` | Supabase OAuth callback |
| `/admin/login` | Admin PIN entry |
| `/admin` | Full admin dashboard — stats, revenue, all bookings |
| `/admin/dispatch` | Admin dispatch console (Realtime auto-refresh) |
| `/api/seed` | POST — seed test customer + 2 bookings |
| `/api/admin-auth` | POST/DELETE — admin cookie auth |
| `/api/webhooks/stripe` | Stripe webhook (not yet wired) |

---

## Testing the Full Flow

1. Go to `/admin/dispatch` → enter PIN (`0045`) → click **Seed Test Data**
2. Copy the test credentials shown (`testcustomer@urbanclap.test` / `TestPass123!`)
3. Open a new tab → `/auth/login` → sign in → lands on `/bookings`
4. See 2 bookings: Gold (Pending) + Silver (Completed with review form)
5. Back in admin: click **Mark Assigned** → booking moves to In Progress
6. Refresh customer `/bookings` → Gold shows "Confirmed"
7. Admin: click **Mark as Completed** → booking leaves admin view
8. Customer: refresh `/bookings` → Gold shows "Completed" + star rating form
9. Submit a review → read-only star display appears

---

## Admin

- Dashboard: `/admin` — stats row, filter tabs, all bookings table with inline status actions
- Dispatch: `/admin/dispatch` — live Realtime feed of pending and in-progress jobs
- PIN: set via `ADMIN_PIN` in `.env.local` (default `0045`)
- No Supabase account required — cookie-based auth only, TTL 8 hours

---

## What's Next

- [ ] Add real Stripe keys to unlock Step 5 payment
- [ ] Wire up `/api/webhooks/stripe` to update booking status after payment
- [ ] Contractor portal — onboarding (ABN, insurance), job board, geofence + OTP proof of work
- [ ] Resend domain verification for outbound email to real customers
