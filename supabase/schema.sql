-- ============================================================
-- Urban Clap AU - Supabase Database Schema
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================

-- ── Enable required extensions ────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Enums ─────────────────────────────────────────────────────
create type user_role as enum ('customer', 'contractor', 'admin');
create type service_tier as enum ('Silver', 'Gold', 'Pro');
create type booking_status as enum (
  'pending_dispatch',
  'assigned',
  'completed',
  'cancelled'
);

-- ── profiles ──────────────────────────────────────────────────
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  role          user_role not null default 'customer',
  full_name     text,
  phone_number  text,
  postcode      text,
  created_at    timestamptz not null default now()
);

-- Auto-create a profile row when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── services ──────────────────────────────────────────────────
create table public.services (
  id                uuid primary key default uuid_generate_v4(),
  category_name     text not null,
  base_price_cents  integer not null check (base_price_cents > 0),
  tier              service_tier not null,
  description       text,
  created_at        timestamptz not null default now()
);

-- Seed the three Home Cleaning tiers
insert into public.services (category_name, base_price_cents, tier, description) values
  ('Home Cleaning', 6900, 'Silver', 'Standard clean: vacuuming, mopping, bathroom & kitchen wipe-down.'),
  ('Home Cleaning', 6900, 'Gold',   'Everything in Silver plus window wiping & deep kitchen scrub.'),
  ('Home Cleaning', 6900, 'Pro',    'Everything in Gold plus inside-oven & fridge clean. Top-rated contractors only.');

-- ── bookings ──────────────────────────────────────────────────
create table public.bookings (
  id                        uuid primary key default uuid_generate_v4(),
  customer_id               uuid not null references public.profiles(id),
  service_id                uuid not null references public.services(id),
  address                   text not null,
  suburb                    text not null,
  postcode                  text not null,
  bedrooms_count            integer not null default 1 check (bedrooms_count >= 0),
  bathrooms_count           integer not null default 1 check (bathrooms_count >= 0),
  scheduled_datetime        timestamptz not null,
  status                    booking_status not null default 'pending_dispatch',
  total_price_cents         integer not null check (total_price_cents > 0),
  stripe_payment_intent_id  text,
  assigned_contractor_id    uuid references public.profiles(id),
  created_at                timestamptz not null default now()
);

-- ── Row Level Security ─────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.services  enable row level security;
alter table public.bookings  enable row level security;

-- Helper: check if the calling user is an admin
create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- profiles policies
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select using (public.is_admin());

-- services policies (public read)
create policy "Anyone can read services"
  on public.services for select using (true);

-- bookings policies
create policy "Customers can insert own bookings"
  on public.bookings for insert with check (auth.uid() = customer_id);

create policy "Customers can view own bookings"
  on public.bookings for select using (auth.uid() = customer_id);

create policy "Admins can view all bookings"
  on public.bookings for select using (public.is_admin());

create policy "Admins can update all bookings"
  on public.bookings for update using (public.is_admin());

-- ── Indexes ───────────────────────────────────────────────────
create index bookings_customer_id_idx  on public.bookings (customer_id);
create index bookings_status_idx       on public.bookings (status);
create index bookings_scheduled_idx    on public.bookings (scheduled_datetime);
