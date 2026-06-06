-- Run this in Supabase SQL Editor (Project → SQL Editor → New Query)
-- Adds 'payment_pending' as the first value in the booking_status enum.
-- This must be run before deploying the Stripe webhook feature.

alter type booking_status add value if not exists 'payment_pending' before 'pending_dispatch';
