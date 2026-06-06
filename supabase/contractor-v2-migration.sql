alter table public.profiles
  add column if not exists contractor_categories  text[]  default '{}',
  add column if not exists bank_bsb               text,
  add column if not exists bank_account_number    text,
  add column if not exists experience_years       integer,
  add column if not exists reference_name         text,
  add column if not exists reference_phone        text,
  add column if not exists license_number         text,
  add column if not exists equipment_owned        boolean default false,
  add column if not exists referral_code          text,
  add column if not exists referred_by            text;

create unique index if not exists profiles_referral_code_idx
  on public.profiles (referral_code)
  where referral_code is not null;
