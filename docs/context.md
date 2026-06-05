# Project Context — Urban Clap AU

## Stack
Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Supabase · Stripe · Lucide React

## Project Path
`/Users/2018imac/MVP FOR URBAN CLAP /urban-clap-au`

---

## What exists right now

**Pages**
- `/` — marketing landing page
- `/book` — 5-step booking funnel (Home Cleaning only)
- `/auth/login` — sign in / sign up
- `/admin/dispatch` — admin-only Wizard of Oz dispatch console

**Key files**
- `supabase/schema.sql` — full DB migration (already run in Supabase SQL Editor ✓)
- `src/context/BookingContext.tsx` — all 5-step form state
- `src/hooks/usePricingCalculator.ts` — pricing engine (integer cents)
- `src/app/actions/bookings.ts` — server actions (Stripe + Supabase)
- `src/lib/supabase/client.ts` and `server.ts` — Supabase clients
- `src/types/index.ts` — all shared types and enums
- `src/components/booking/AuthGate.tsx` — inline auth gate shown at Step 5

**Pricing formula**
`(6900 + bedrooms×3500 + bathrooms×2500) × tier_multiplier`
Silver 1.0× · Gold 1.4× · Pro 1.8× · All prices AUD incl. GST

---

## Infrastructure status

- **Supabase** ✓ — project created, schema run, keys in `.env.local`
- **Supabase Auth** ✓ — sign up / sign in working, email verification working
- **Supabase redirect URLs** — set Site URL + callback URL in Auth → URL Configuration
- **Stripe** ✗ — keys not yet added to `.env.local`. Step 5 shows "Could not initialise payment" until this is done.

---

## Booking funnel behaviour

- Steps 1–4: open to all visitors, no login required
- Step 5: `AuthGate` wraps `StepCheckout` — if not logged in, shows inline sign in / sign up form. On auth, automatically proceeds to payment.
- After login, user is redirected to `/bookings` (My Bookings page) by default, or to the `?next=` URL if provided.

---

## What's NOT built yet

1. Stripe setup — add real keys to `.env.local` to unlock Step 5 payment (est. 5 min)
2. Stripe webhook (`/api/webhooks/stripe`) — update booking status after payment
3. ~~Customer "My Bookings" page~~ ✓ done
4. ~~Email confirmation after booking~~ ✓ done (Resend — add real API key to activate)
5. ~~Admin dispatch console~~ ✓ done (PIN-protected, SMS dispatch, status updates)
6. ~~Customer review / star rating~~ ✓ done (reviews table, ReviewForm component)
7. Full admin dashboard (`/admin`) — stats, revenue, all-bookings table across statuses
8. Supabase Realtime in dispatch console (auto-refresh without clicking Refresh)
9. Contractor job accept/reject flow
10. Production deployment (Vercel + Supabase prod)
11. Resend domain verification — `onboarding@resend.dev` only delivers to Resend account email

---

## Session Log

### 2026-06-04 — Session 1
Built the entire initial MVP from scratch:
- Full Supabase schema (profiles, services, bookings, RLS, trigger, seeded tiers)
- 5-step booking funnel with persistent React context
- Pricing calculator hook
- Stripe Elements checkout + server actions
- Admin dispatch console with SMS clipboard generator
- Marketing landing page + auth page
- `npm run build` passes clean — zero TypeScript errors

### 2026-06-04 — Session 2
- Connected Supabase: created project, ran schema, added keys to `.env.local`
- Confirmed auth flow works: sign up, email verification, sign in → redirects to `/`
- Fixed email verification redirect: set Site URL + callback URL in Supabase Auth → URL Configuration
- Added `AuthGate` component — soft login gate at Step 5 (inline, booking state preserved)
- Confirmed Step 5 "Could not initialise payment" is a Stripe error (not auth) — expected until Stripe keys are added

**Left off:** Stripe keys not yet configured. Next session: either add Stripe keys (5 min) to unblock full booking flow, or build "My Bookings" page.

### 2026-06-04 — Session 3
- Fixed email verification redirect: `AuthGate` now passes `emailRedirectTo` → `/auth/callback?next=/book`, so clicking the verification link brings the user back to Step 5 of the booking funnel automatically.
- `/auth/login` now respects `?next=` query param for post-sign-in redirect.
- Built `/bookings` — "My Bookings" page: server-side auth guard, booking cards with tier badge, status badge (Pending/Confirmed/Completed/Cancelled), date/time, address, bed/bath, price. Empty state + "Book your first clean" CTA.
- Landing page nav now shows "My Bookings" for logged-in users, "Sign In" for guests (server-side auth check).
- Installed `resend` and wired booking confirmation email: fires after `confirmBooking` succeeds, non-blocking (failures swallowed). Branded HTML template with all booking details + "View My Bookings" CTA.
- Added `RESEND_API_KEY` and `RESEND_FROM_EMAIL` placeholders to `.env.local`.

**Left off:** Add real Resend API key to `.env.local` (resend.com/api-keys). For testing, `onboarding@resend.dev` only delivers to your Resend account email — verify a domain to send to real customers. Stripe still needs real keys to unlock full payment flow.

### 2026-06-04 — Session 4

**Responsive + UX polish**
- Made entire app responsive: landing page, booking funnel, My Bookings — tested across mobile/tablet/laptop/desktop breakpoints
- Moved Sign Out button out of the nav — now sits in a user identity pill (avatar icon · name · Sign Out) under the "My Bookings" heading
- Removed Sign Out from landing page nav entirely (was showing on tablet+ screens)
- Time slot grid: `grid-cols-3 sm:grid-cols-5` (was `grid-cols-4`, broke on mobile)

**Admin dispatch console**
- Built `/admin/dispatch` as a PIN-protected Wizard of Oz console
- PIN stored in `.env.local` as `ADMIN_PIN=0045`; cookie TTL = 8 hours
- No Supabase account required for admin — PIN cookie auth only
- Created `/admin/login` page (dark-themed PIN entry form)
- Created `/api/admin-auth` — POST sets cookie, DELETE clears it (sign out)
- Admin sign out button added to dispatch nav (LogOut icon + "Sign Out" label)
- Fixed "permission denied for table bookings" by creating `src/lib/supabase/admin.ts` — service-role client with `persistSession: false, autoRefreshToken: false`

**Full dispatch workflow** (added this session)
- Dispatch now shows two sections: **Pending Dispatch** (SMS copy + Mark Assigned) and **In Progress** (Mark Completed)
- `getActiveBookings()` returns both `pending_dispatch` and `assigned` bookings
- `updateBookingStatus(id, status)` server action uses admin client — bypasses RLS
- Optimistic UI updates: status changes reflect instantly without waiting for server

**Test data seeding**
- `POST /api/seed` (admin PIN protected) creates `testcustomer@urbanclap.test` / `TestPass123!`
- Seeds 2 bookings: Gold 3bed/2bath $313.60 (pending_dispatch) + Silver 2bed/1bath $164.00 (completed)
- "Seed Test Data" button in dispatch nav shows credentials panel with copy button after seeding

**Customer review system**
- Added `reviews` table (run SQL manually in Supabase — see below)
- `ReviewForm` client component: 5-star selector + optional comment, shown on completed booking cards
- `submitReview` server action: upserts to `reviews` table (one review per booking)
- After submit: turns into read-only star display; `router.refresh()` syncs server state
- Reviews loaded via admin client on bookings page (consistent with booking query approach)

**Bug fixes**
- `/bookings` page now uses admin client for all DB queries (prevents RLS permission errors regardless of policies)
- After sign in, redirect defaults to `/bookings` instead of `/`
- `BookingStatus` type import added to `bookings.ts` (was missing, caused build error)

**SQL to run in Supabase (reviews table):**
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

**Full test flow:**
1. Go to `/admin/dispatch` → click **Seed Test Data** → copy credentials
2. Open new tab → `/auth/login` → sign in as `testcustomer@urbanclap.test` / `TestPass123!` → lands on `/bookings`
3. See 2 bookings: Gold (Pending) + Silver (Completed with review form)
4. Back in admin: click **Mark Assigned** → job moves to In Progress section
5. Refresh customer `/bookings` → Gold shows "Confirmed"
6. Admin: click **Mark as Completed** → job leaves admin view
7. Customer: refresh `/bookings` → Gold shows "Completed" + star rating form
8. Submit review → read-only star display

**Left off:** Stripe keys still placeholder. Next priorities: (1) full admin dashboard with stats + revenue, or (2) Stripe payment integration.
