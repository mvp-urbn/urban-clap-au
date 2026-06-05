'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe';
import { BookingFormState, BookingStatus, ServiceTier } from '@/types';
import { getResend, FROM_EMAIL } from '@/lib/resend';
import { buildBookingConfirmationEmail } from '@/lib/emails/bookingConfirmation';

export async function createPaymentIntent(
  totalCents: number,
  metadata: Record<string, string>
) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalCents,
    currency: 'aud',
    automatic_payment_methods: { enabled: true },
    metadata,
  });

  return { clientSecret: paymentIntent.client_secret, id: paymentIntent.id };
}

export async function confirmBooking(
  formState: BookingFormState,
  paymentIntentId: string
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  // Resolve service ID from tier
  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('id')
    .eq('tier', formState.tier)
    .eq('category_name', 'Home Cleaning')
    .single();

  if (serviceError || !service) throw new Error('Service not found');

  // Combine date + timeSlot into a UTC timestamptz
  const scheduled = new Date(`${formState.date} ${formState.timeSlot}`);

  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      customer_id: user.id,
      service_id: service.id,
      address: formState.address,
      suburb: formState.suburb,
      postcode: formState.postcode,
      bedrooms_count: formState.bedrooms,
      bathrooms_count: formState.bathrooms,
      scheduled_datetime: scheduled.toISOString(),
      total_price_cents: formState.totalPriceCents,
      stripe_payment_intent_id: paymentIntentId,
      status: 'pending_dispatch',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Fire confirmation email — non-blocking, failure must not break the booking
  if (booking && user.email && formState.tier) {
    const { subject, html } = buildBookingConfirmationEmail({
      customerName: (user.user_metadata?.full_name as string | undefined) ?? user.email,
      bookingRef: booking.id,
      tier: formState.tier as ServiceTier,
      categoryName: 'Home Cleaning',
      scheduledDatetime: booking.scheduled_datetime,
      address: formState.address,
      suburb: formState.suburb,
      postcode: formState.postcode,
      bedrooms: formState.bedrooms,
      bathrooms: formState.bathrooms,
      totalPriceCents: formState.totalPriceCents,
    });

    getResend().emails
      .send({ from: FROM_EMAIL, to: user.email, subject, html })
      .catch(() => { /* swallow — booking is already saved */ });
  }

  return booking;
}

export async function getPendingBookings() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
      *,
      profiles:customer_id ( full_name, phone_number ),
      services:service_id ( tier, category_name )
    `
    )
    .eq('status', 'pending_dispatch')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getMyBookings() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
      *,
      services:service_id ( tier, category_name )
    `
    )
    .eq('customer_id', user.id)
    .order('scheduled_datetime', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function assignContractor(
  bookingId: string,
  contractorId: string
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('bookings')
    .update({ assigned_contractor_id: contractorId, status: 'assigned' })
    .eq('id', bookingId);

  if (error) throw new Error(error.message);
}

export async function getActiveBookings() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
      *,
      profiles:customer_id ( full_name, phone_number ),
      services:service_id ( tier, category_name )
    `
    )
    .in('status', ['pending_dispatch', 'assigned'])
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function updateBookingStatus(bookingId: string, status: BookingStatus) {
  const supabase = createAdminClient();

  const patch: Record<string, unknown> = { status };
  if (status === 'assigned') {
    // 6-digit OTP for contractor proof-of-arrival
    patch.checkin_otp = Math.floor(100000 + Math.random() * 900000).toString();
  }

  const { error } = await supabase
    .from('bookings')
    .update(patch)
    .eq('id', bookingId);

  if (error) throw new Error(error.message);
}

export async function getAllBookings() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
      *,
      profiles:customer_id ( full_name, phone_number ),
      services:service_id ( tier, category_name )
    `
    )
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getAdminStats() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('bookings')
    .select('status, total_price_cents, customer_id');

  if (error) throw new Error(error.message);

  const rows = data ?? [];
  const totalRevenueCents = rows
    .filter((r) => r.status === 'completed')
    .reduce((sum, r) => sum + (r.total_price_cents ?? 0), 0);
  const uniqueCustomers = new Set(rows.map((r) => r.customer_id)).size;

  return {
    totalRevenueCents,
    uniqueCustomers,
    pending: rows.filter((r) => r.status === 'pending_dispatch').length,
    assigned: rows.filter((r) => r.status === 'assigned').length,
    completed: rows.filter((r) => r.status === 'completed').length,
    cancelled: rows.filter((r) => r.status === 'cancelled').length,
    total: rows.length,
  };
}

export async function submitReview(bookingId: string, rating: number, comment: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.from('reviews').upsert(
    { booking_id: bookingId, customer_id: user.id, rating, comment },
    { onConflict: 'booking_id' }
  );

  if (error) throw new Error(error.message);
}
