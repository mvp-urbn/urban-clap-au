'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ContractorStatus } from '@/types';

export async function saveContractorOnboarding({
  fullName,
  phone,
  abn,
  insuranceExpiry,
  servicePostcodes,
}: {
  fullName: string;
  phone: string;
  abn: string;
  insuranceExpiry: string;
  servicePostcodes: string[];
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const admin = createAdminClient();
  const { error } = await admin
    .from('profiles')
    .update({
      role: 'contractor',
      full_name: fullName,
      phone_number: phone,
      abn,
      insurance_expiry: insuranceExpiry,
      service_postcodes: servicePostcodes,
      contractor_status: 'pending',
    })
    .eq('id', user.id);

  if (error) throw new Error(error.message);
}

export async function getContractorProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return data;
}

export async function getContractorJobs() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('bookings')
    .select(`
      *,
      services:service_id ( tier, category_name ),
      profiles:customer_id ( full_name, phone_number )
    `)
    .eq('assigned_contractor_id', user.id)
    .in('status', ['assigned', 'completed'])
    .order('scheduled_datetime', { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getContractorJob(bookingId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('bookings')
    .select(`
      *,
      services:service_id ( tier, category_name ),
      profiles:customer_id ( full_name, phone_number )
    `)
    .eq('id', bookingId)
    .eq('assigned_contractor_id', user.id)
    .single();

  if (error) return null;
  return data;
}

export async function contractorCheckIn(bookingId: string, lat: number | null, lng: number | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const admin = createAdminClient();
  const { error } = await admin
    .from('bookings')
    .update({ checked_in_at: new Date().toISOString() })
    .eq('id', bookingId)
    .eq('assigned_contractor_id', user.id);

  if (error) throw new Error(error.message);
  return { lat, lng }; // passed through for future radius validation
}

export async function verifyJobOtp(bookingId: string, otp: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const admin = createAdminClient();

  const { data: booking, error: fetchError } = await admin
    .from('bookings')
    .select('checkin_otp, checked_in_at')
    .eq('id', bookingId)
    .eq('assigned_contractor_id', user.id)
    .single();

  if (fetchError || !booking) return { success: false, error: 'Job not found' };
  if (!booking.checkin_otp) return { success: false, error: 'No OTP set for this job — contact support' };
  if (booking.checkin_otp !== otp.trim()) return { success: false, error: 'Incorrect code — ask the customer to double-check' };

  if (!booking.checked_in_at) {
    await admin
      .from('bookings')
      .update({ checked_in_at: new Date().toISOString() })
      .eq('id', bookingId)
      .eq('assigned_contractor_id', user.id);
  }

  return { success: true };
}

export async function getAllContractors() {
  const admin = createAdminClient();

  const { data: profiles, error } = await admin
    .from('profiles')
    .select('*')
    .eq('role', 'contractor')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const emailMap = new Map(users.map((u) => [u.id, u.email ?? null]));

  return (profiles ?? []).map((p) => ({
    ...p,
    email: emailMap.get(p.id) ?? null,
  }));
}

// Returns reviews for this contractor's completed jobs.
// Default window: 15 days. If the customer who left the review also has an upcoming
// booking (they're "active/busy"), the window shrinks to 9 days so the contractor's
// feed stays fresh.
export async function getContractorReviews() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const admin = createAdminClient();

  // Pull all reviews with their booking so we can filter by assigned_contractor_id
  const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await admin
    .from('reviews')
    .select(`
      id, booking_id, rating, comment, created_at,
      bookings:booking_id (
        id, suburb, postcode, scheduled_datetime, assigned_contractor_id, customer_id,
        services:service_id ( tier )
      )
    `)
    .gte('created_at', fifteenDaysAgo)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  // Filter to this contractor's jobs
  const mine = (data ?? []).filter(
    (r) => (r.bookings as any)?.assigned_contractor_id === user.id,
  );

  if (mine.length === 0) return [];

  // Collect unique customer IDs to check for upcoming bookings (the "busy" signal)
  const customerIds = [...new Set(mine.map((r) => (r.bookings as any)?.customer_id).filter(Boolean))];
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const { data: upcoming } = await admin
    .from('bookings')
    .select('customer_id')
    .in('customer_id', customerIds)
    .in('status', ['pending_dispatch', 'assigned'])
    .gte('scheduled_datetime', tomorrow);

  const busyCustomers = new Set((upcoming ?? []).map((b) => b.customer_id));

  // 9-day cutoff for reviews from busy customers
  const nineDaysAgo = new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString();

  return mine.filter((r) => {
    const customerId = (r.bookings as any)?.customer_id;
    if (customerId && busyCustomers.has(customerId)) {
      return r.created_at >= nineDaysAgo;
    }
    return true; // falls within 15-day window already applied above
  });
}

export async function updateContractorStatus(contractorId: string, status: ContractorStatus) {
  const admin = createAdminClient();
  const { error } = await admin
    .from('profiles')
    .update({ contractor_status: status })
    .eq('id', contractorId);

  if (error) throw new Error(error.message);
}
