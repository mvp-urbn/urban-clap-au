# Urban Clap AU

A fixed-price, tiered home cleaning booking platform for the Australian market. Built as a lean "Wizard of Oz" MVP — customers book online, operations are handled manually via an admin dispatch console.

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Supabase** — PostgreSQL, Auth, Row Level Security
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
- PIN-protected admin dispatch console with SMS copy-paste workflow
- Test data seed endpoint for demo flow without Stripe

## Pricing

```
(base $69 + bedrooms × $35 + bathrooms × $25) × tier multiplier
Silver 1.0× · Gold 1.4× · Pro 1.8×
All prices AUD incl. GST
```

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

## Routes

| Route | Description |
|---|---|
| `/` | Marketing landing page |
| `/book` | 5-step booking funnel |
| `/bookings` | Customer bookings dashboard |
| `/auth/login` | Sign in / sign up |
| `/auth/callback` | Supabase OAuth callback |
| `/admin/login` | Admin PIN entry |
| `/admin/dispatch` | Admin dispatch console |
| `/api/seed` | POST — seed test customer + 2 bookings |
| `/api/admin-auth` | POST/DELETE — admin cookie auth |
| `/api/webhooks/stripe` | Stripe webhook (not yet wired) |

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

## Admin Dispatch

- URL: `/admin/dispatch`
- PIN: set via `ADMIN_PIN` in `.env.local` (default `0045`)
- No Supabase account required — cookie-based auth only
- Cookie TTL: 8 hours

## What's Next

- [ ] Add real Stripe keys to unlock Step 5 payment
- [ ] Wire up `/api/webhooks/stripe` to update booking status after payment
- [ ] Full admin dashboard with stats and revenue tracking
- [ ] Supabase Realtime for auto-refresh in dispatch console
- [ ] Contractor job accept/reject flow
- [ ] Resend domain verification for outbound email
- [ ] Production deployment on Vercel
