-- Urban Clap AU — Reviews Table
-- Run once in: Supabase Dashboard > SQL Editor
-- Must be run AFTER schema.sql

-- ── reviews ───────────────────────────────────────────────────
create table if not exists public.reviews (
  id          uuid primary key default uuid_generate_v4(),
  booking_id  uuid not null references public.bookings(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  rating      integer not null check (rating between 1 and 5),
  comment     text,
  created_at  timestamptz not null default now(),
  unique (booking_id)
);

-- ── RLS ───────────────────────────────────────────────────────
alter table public.reviews enable row level security;

-- Customers can insert their own reviews
create policy "Customers can insert own reviews"
  on public.reviews for insert
  with check (auth.uid() = customer_id);

-- Customers can update their own reviews
create policy "Customers can update own reviews"
  on public.reviews for update
  using (auth.uid() = customer_id);

-- Customers can view their own reviews
create policy "Customers can view own reviews"
  on public.reviews for select
  using (auth.uid() = customer_id);

-- Admins can view all reviews
create policy "Admins can view all reviews"
  on public.reviews for select
  using (public.is_admin());

-- ── Index ─────────────────────────────────────────────────────
create index if not exists reviews_booking_id_idx on public.reviews (booking_id);
create index if not exists reviews_customer_id_idx on public.reviews (customer_id);
