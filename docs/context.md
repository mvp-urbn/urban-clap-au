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
7. ~~Full admin dashboard (`/admin`)~~ ✓ done (stats row, filter tabs, all-bookings table, inline status actions)
8. ~~Supabase Realtime in dispatch console~~ ✓ done (auto-refresh without clicking Refresh)
9. ~~Production deployment (Vercel)~~ ✓ done — https://urban-clap-au.vercel.app
10. Stripe setup — add real keys to `.env.local` to unlock Step 5 payment (est. 5 min)
11. Stripe webhook (`/api/webhooks/stripe`) — update booking status after payment
12. Contractor portal — onboarding (ABN, insurance), job board, geofence + OTP proof of work
13. Resend domain verification — needs a domain before emails can reach real customers

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

### 2026-06-06 — Session 5

**GitHub repo setup + README**
- Initialised git repo in project root, committed all MVP code as initial commit
- Created GitHub repo `mvp-urbn/urban-clap-au` at `https://github.com/mvp-urbn/urban-clap-au`
- Replaced boilerplate `create-next-app` README with full project README covering: stack, features, pricing formula, env var setup, DB SQL, routes table, 8-step test flow walkthrough, admin dispatch info, and "What's Next" checklist
- Pushed both commits to GitHub main branch

**GitHub auth + macOS Keychain**
- Configured `credential.helper osxkeychain` globally so future pushes don't require a token
- Seeded macOS Keychain with GitHub PAT for `github.com` / `mvp-urbn` — credential cached for all future pushes
- PAT used transiently in remote URL during push, then immediately cleaned from git config

**Claude Code auto-permissions**
- Added git command allow rules to `~/.claude/settings.json` so all git operations (add, commit, push, pull, status, log, diff, branch, remote) run without permission prompts in any future session

**Left off:** All MVP code is on GitHub. No new features built this session. Next priorities:
1. Add real Stripe keys to `.env.local` → unlocks Step 5 payment (est. 10 min)
2. Wire `/api/webhooks/stripe` → update booking status after payment
3. Full admin dashboard (`/admin`) — stats row (revenue, booking counts), all-bookings table with filters and status actions
4. Supabase Realtime — auto-refresh dispatch console without Refresh button
5. Resend domain verification — verify a domain to send emails to real customers
6. Production deployment on Vercel + Supabase prod environment

### 2026-06-06 — Session 6

**Full admin dashboard `/admin`**
- New server actions: `getAllBookings()` (all bookings with profile+service join, ordered newest first) and `getAdminStats()` (revenue, counts by status, unique customers)
- `src/app/admin/page.tsx` — PIN auth guard (same `admin_pin` cookie), parallel fetch of bookings + stats, renders `AdminDashboard`
- `src/app/admin/AdminDashboard.tsx` — client component:
  - Stats row: Revenue (completed), Customers, Pending, In Progress, Completed
  - Filter tabs: All / Pending / In Progress / Completed / Cancelled (with counts)
  - Full bookings table: Date, Customer, Address (hidden on mobile), Service tier + bed/bath, Price, Status badge, Action buttons
  - Inline status actions: Mark Assigned, Mark Completed, Cancel (with optimistic UI + revert on error)
  - Nav links to Dispatch Console, Refresh, Sign Out
- Separate nav in admin pages: admin nav links between `/admin` (dashboard) and `/admin/dispatch` (dispatch console)

**Supabase Realtime in dispatch console**
- `DispatchDashboard.tsx` now subscribes to `postgres_changes` on `bookings` table via the browser Supabase client
- On any INSERT/UPDATE/DELETE → automatically calls `getActiveBookings()` server action to refresh booking list
- Live status indicator in top nav: amber when connecting, turns green ("Live · N Pending") once SUBSCRIBED
- Channel cleaned up on unmount via `useRef` + `useEffect` cleanup
- Manual Refresh button kept as fallback

**To enable Realtime: in Supabase Dashboard → Database → Replication → enable `bookings` table**

**Vercel deployment**
- All 10 env vars pushed to Vercel project `urban-clap-au` (tioatrs-projects scope) via CLI
- Production aliases: `urban-clap-au-tioatrs-projects.vercel.app` and `urban-clap-au-tioatr-tioatrs-projects.vercel.app`
- Deploy in progress at session end — first build (no cache) takes ~5–10 min

**Left off:** 
1. Add real Stripe keys to `.env.local` AND to Vercel env vars → unlocks Step 5 payment
2. Wire `/api/webhooks/stripe` → update booking status after Stripe payment confirmed
3. Enable Supabase Realtime on `bookings` table (Dashboard → Database → Replication)
4. Update `NEXT_PUBLIC_APP_URL` on Vercel to final production domain once assigned
5. Resend domain verification → send emails to real customers (not just Resend account email)
6. Connect GitHub repo to Vercel project (currently deploying via local CLI upload, not Git push)

### 2026-06-06 — Session 7

**GitHub credential fix**
- macOS Keychain had stale PAT cached — push was returning "Repository not found"
- Fixed: set remote URL with new PAT, pushed successfully, restored clean remote URL
- `git push origin main` now works — repo and Vercel are in sync

**Supabase Realtime enabled**
- Supabase Dashboard UI changed — "Replication" now means read replicas, not Realtime
- Correct path: Database → Publications → `supabase_realtime` → toggled `bookings` table ON
- Dispatch console now auto-refreshes live without clicking Refresh

**Resend domain verification — skipped**
- No domain owned yet — deferred until ready to go live with real customers
- Emails still deliver to Resend account email during testing

**Vercel ↔ GitHub auto-deploy — skipped**
- Vercel couldn't show `mvp-urbn` account in repo picker (only showed `Tioatr`)
- GitHub App was installed on `mvp-urbn` correctly but Vercel UI didn't reflect it
- Workaround: continue using `npx vercel --prod --yes` from CLI for deployments

**Claude Code auto-permissions expanded**
- Added `Bash(npx vercel *)` to `~/.claude/settings.json` — Vercel deploys now run without permission prompts
- Git operations were already auto-approved from Session 5

**README updated — project blueprint merged**
- Merged user-provided project blueprint into existing README without breaking old content
- Added: project status matrix table (Customer ✓, Admin ✓, Contractor 🆕)
- Added: 3 codebase rules (monetary integers, state machine, don't break existing flows)
- Added: full directory structure blueprint including contractor portal placeholders
- Updated: What's Next section reflects current state (admin dashboard + Realtime + Vercel = done)
- No duplicates — all content merged cleanly

**Left off:**
1. Add real Stripe keys to `.env.local` AND Vercel → unlocks Step 5 payment (est. 5 min)
2. Wire `/api/webhooks/stripe` → update booking status after Stripe payment confirmed (est. 30 min)
3. Contractor portal — onboarding (ABN, insurance), job board, geofence + OTP proof of work
4. Resend domain verification → send emails to real customers (needs a domain first)
5. GitHub → Vercel auto-deploy (deferred — use `npx vercel --prod --yes` for now)
