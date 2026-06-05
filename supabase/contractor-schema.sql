-- Urban Clap AU — Contractor Portal Schema Additions
-- Run once in: Supabase Dashboard > SQL Editor
-- Must be run AFTER the main schema.sql

-- ── Add contractor fields to profiles ────────────────────────
alter table public.profiles
  add column if not exists abn text,
  add column if not exists insurance_expiry date,
  add column if not exists contractor_status text
    default 'pending'
    check (contractor_status in ('pending', 'approved', 'suspended')),
  add column if not exists service_postcodes text[];

-- ── Add OTP + geofence check-in to bookings ──────────────────
alter table public.bookings
  add column if not exists checkin_otp text,
  add column if not exists checked_in_at timestamptz;

-- ── RLS: contractors see their own assigned bookings ──────────
create policy "Contractors can view assigned bookings"
  on public.bookings for select
  using (auth.uid() = assigned_contractor_id);

-- ── RLS: contractors can update check-in on their jobs ────────
create policy "Contractors can update assigned bookings"
  on public.bookings for update
  using (auth.uid() = assigned_contractor_id)
  with check (auth.uid() = assigned_contractor_id);
