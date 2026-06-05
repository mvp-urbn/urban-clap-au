import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';

const TEST_EMAIL = 'testcustomer@urbanclap.test';
const TEST_PASSWORD = 'TestPass123!';

export async function POST() {
  const cookieStore = await cookies();
  if (cookieStore.get('admin_pin')?.value !== process.env.ADMIN_PIN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Create or reuse test user
  let userId: string;

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: 'Sarah Johnson' },
  });

  if (createError) {
    // User already exists — find them
    const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
    const existing = list?.users?.find((u) => u.email === TEST_EMAIL);
    if (!existing) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }
    userId = existing.id;
  } else {
    userId = created.user!.id;
  }

  // Upsert profile
  await supabase.from('profiles').upsert(
    { id: userId, role: 'customer', full_name: 'Sarah Johnson', phone_number: '0412 345 678', postcode: '2010' },
    { onConflict: 'id' }
  );

  // Find service IDs
  const { data: services } = await supabase
    .from('services')
    .select('id, tier')
    .eq('category_name', 'Home Cleaning')
    .in('tier', ['Gold', 'Silver']);

  const goldService = services?.find((s) => s.tier === 'Gold');
  const silverService = services?.find((s) => s.tier === 'Silver');

  if (!goldService || !silverService) {
    return NextResponse.json(
      { error: 'Home Cleaning services not found. Make sure the database is seeded with services.' },
      { status: 500 }
    );
  }

  // Delete existing test bookings for a clean slate
  await supabase.from('bookings').delete().eq('customer_id', userId);

  // Booking 1 — Gold, 3 bed / 2 bath, tomorrow 9 am, pending_dispatch
  // Price: (6900 + 3×3500 + 2×2500) × 1.4 = 31360 cents = $313.60
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);

  // Booking 2 — Silver, 2 bed / 1 bath, 5 days ago, completed
  // Price: (6900 + 2×3500 + 1×2500) × 1.0 = 16400 cents = $164.00
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 5);
  lastWeek.setHours(10, 0, 0, 0);

  const { error: insertError } = await supabase.from('bookings').insert([
    {
      customer_id: userId,
      service_id: goldService.id,
      address: '15 Park Avenue',
      suburb: 'Surry Hills',
      postcode: '2010',
      bedrooms_count: 3,
      bathrooms_count: 2,
      scheduled_datetime: tomorrow.toISOString(),
      total_price_cents: 31360,
      stripe_payment_intent_id: null,
      status: 'pending_dispatch',
    },
    {
      customer_id: userId,
      service_id: silverService.id,
      address: '15 Park Avenue',
      suburb: 'Surry Hills',
      postcode: '2010',
      bedrooms_count: 2,
      bathrooms_count: 1,
      scheduled_datetime: lastWeek.toISOString(),
      total_price_cents: 16400,
      stripe_payment_intent_id: null,
      status: 'completed',
    },
  ]);

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });
}
