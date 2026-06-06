import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

// Stripe requires the raw body to verify the webhook signature.
// Next.js App Router exposes it via request.text().
export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 });
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent;
    const admin = createAdminClient();

    // Only flip payment_pending → pending_dispatch.
    // If confirmBooking already ran from the client, status is already pending_dispatch — no-op.
    const { error } = await admin
      .from('bookings')
      .update({ status: 'pending_dispatch' })
      .eq('stripe_payment_intent_id', pi.id)
      .eq('status', 'payment_pending');

    if (error) {
      console.error('Webhook: failed to update booking status', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
