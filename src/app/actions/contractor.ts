'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

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
