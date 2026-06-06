'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ContractorStatus } from '@/types';

// Bypasses email confirmation — used until a verified sending domain is set up in Resend.
// Creates the user via admin API (email auto-confirmed), so they can log in immediately.
export async function contractorSignupNoEmail({
  fullName,
  phone,
  email,
  password,
}: {
  fullName: string;
  phone: string;
  email: string;
  password: string;
}): Promise<{ error: string | null }> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, phone_number: phone },
  });
  if (error) return { error: error.message };
  if (!data.user) return { error: 'Account creation failed' };
  return { error: null };
}

export async function saveContractorOnboarding({
  fullName,
  phone,
  abn,
  insuranceExpiry,
  insuranceDocumentUrl,
  servicePostcodes,
  categories,
  experienceYears,
  referenceName,
  referencePhone,
  bankBsb,
  bankAccountNumber,
  licenseNumber,
  equipmentOwned,
}: {
  fullName: string;
  phone: string;
  abn: string;
  insuranceExpiry: string;
  insuranceDocumentUrl: string;
  servicePostcodes: string[];
  categories: string[];
  experienceYears: number;
  referenceName: string;
  referencePhone: string;
  bankBsb: string;
  bankAccountNumber: string;
  licenseNumber: string;
  equipmentOwned: boolean;
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
      insurance_expiry: insuranceExpiry || null,
      insurance_document_url: insuranceDocumentUrl || null,
      service_postcodes: servicePostcodes,
      contractor_status: 'pending',
      contractor_categories: categories,
      experience_years: experienceYears || null,
      reference_name: referenceName || null,
      reference_phone: referencePhone || null,
      bank_bsb: bankBsb || null,
      bank_account_number: bankAccountNumber || null,
      license_number: licenseNumber || null,
      equipment_owned: equipmentOwned,
    })
    .eq('id', user.id);

  if (error) throw new Error(error.message);
}

export async function saveBankDetails(bsb: string, accountNumber: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const admin = createAdminClient();
  const { error } = await admin
    .from('profiles')
    .update({ bank_bsb: bsb, bank_account_number: accountNumber })
    .eq('id', user.id);

  if (error) throw new Error(error.message);
}

export async function getOrCreateReferralCode(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('referral_code')
    .eq('id', user.id)
    .single();

  if (profile?.referral_code) return profile.referral_code;

  const code = 'UCAU-' + Math.random().toString(36).slice(2, 6).toUpperCase();
  await admin
    .from('profiles')
    .update({ referral_code: code })
    .eq('id', user.id);

  return code;
}

export async function getContractorDashboardData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const admin = createAdminClient();

  const [profileRes, jobsRes, { data: { users } }] = await Promise.all([
    admin.from('profiles').select('*').eq('id', user.id).single(),
    admin
      .from('bookings')
      .select(`
        *,
        services:service_id ( tier, category_name ),
        profiles:customer_id ( full_name, phone_number )
      `)
      .eq('assigned_contractor_id', user.id)
      .in('status', ['assigned', 'completed', 'cancelled'])
      .order('scheduled_datetime', { ascending: true }),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const profile = profileRes.data;
  const allJobs = jobsRes.data ?? [];

  const emailMap = new Map((users ?? []).map((u) => [u.id, u.email ?? null]));
  const email = emailMap.get(user.id) ?? null;

  const now = new Date().toISOString();
  const newJobs = allJobs.filter(
    (j) => j.status === 'assigned' && j.scheduled_datetime >= now,
  );
  const history = allJobs.filter(
    (j) => j.status === 'completed' || j.status === 'cancelled',
  );

  const totalEarningsCents = history
    .filter((j) => j.status === 'completed')
    .reduce((sum, j) => sum + Math.round(j.total_price_cents * 0.8), 0);

  const reviewsRes = await admin
    .from('reviews')
    .select('rating, bookings:booking_id ( assigned_contractor_id )')
    .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

  const myReviews = (reviewsRes.data ?? []).filter(
    (r) => (r.bookings as unknown as { assigned_contractor_id: string } | null)?.assigned_contractor_id === user.id,
  );
  const avgRating =
    myReviews.length > 0
      ? (myReviews.reduce((s, r) => s + r.rating, 0) / myReviews.length).toFixed(1)
      : null;

  return { profile, newJobs, history, totalEarningsCents, avgRating, email };
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
  return { lat, lng };
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

export async function getContractorReviews() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const admin = createAdminClient();

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

  const mine = (data ?? []).filter(
    (r) => (r.bookings as unknown as { assigned_contractor_id: string } | null)?.assigned_contractor_id === user.id,
  );

  if (mine.length === 0) return [];

  const customerIds = [...new Set(mine.map((r) => (r.bookings as unknown as { customer_id: string } | null)?.customer_id).filter(Boolean))] as string[];
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const { data: upcoming } = await admin
    .from('bookings')
    .select('customer_id')
    .in('customer_id', customerIds)
    .in('status', ['pending_dispatch', 'assigned'])
    .gte('scheduled_datetime', tomorrow);

  const busyCustomers = new Set((upcoming ?? []).map((b) => b.customer_id));

  const nineDaysAgo = new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString();

  return mine.filter((r) => {
    const customerId = (r.bookings as unknown as { customer_id: string } | null)?.customer_id;
    if (customerId && busyCustomers.has(customerId)) {
      return r.created_at >= nineDaysAgo;
    }
    return true;
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
