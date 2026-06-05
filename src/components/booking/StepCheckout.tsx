'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
  Elements,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { CheckCircle2, MapPin, Calendar, BedDouble, Bath, Loader2, AlertCircle } from 'lucide-react';
import { useBooking } from '@/context/BookingContext';
import { Button } from '@/components/ui/Button';
import { createPaymentIntent, confirmBooking } from '@/app/actions/bookings';
import { usePricingCalculator } from '@/hooks/usePricingCalculator';
import { TIER_BADGE_COLORS } from '@/types';
import { cn } from '@/lib/utils';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// ── Booking Summary card ───────────────────────────────────────
function BookingSummary() {
  const { formState } = useBooking();
  const pricing = usePricingCalculator(
    formState.bedrooms,
    formState.bathrooms,
    formState.tier
  );

  const tierColor = formState.tier ? TIER_BADGE_COLORS[formState.tier] : '';

  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3 text-sm">
      <h3 className="font-bold text-slate-800">Booking Summary</h3>

      <div className="space-y-2 text-slate-600">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-xs font-bold px-2 py-0.5 rounded-full border',
              tierColor
            )}
          >
            {formState.tier} Clean
          </span>
          <span className="text-slate-400">Home Cleaning</span>
        </div>

        <div className="flex items-center gap-2">
          <BedDouble className="w-4 h-4 text-slate-400 shrink-0" />
          <span>{formState.bedrooms} bedrooms · {formState.bathrooms} bathrooms</span>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            {new Date(formState.date).toLocaleDateString('en-AU', {
              weekday: 'short',
              day: 'numeric',
              month: 'long',
            })}{' '}
            at {formState.timeSlot}
          </span>
        </div>

        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <span>
            {formState.address}, {formState.suburb} {formState.postcode}
          </span>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-3 space-y-1">
        <div className="flex justify-between text-slate-500 text-xs">
          <span>Service subtotal</span>
          <span>{pricing.formattedSubtotal}</span>
        </div>
        <div className="flex justify-between text-slate-500 text-xs">
          <span>GST included</span>
          <span>{pricing.formattedGST}</span>
        </div>
        <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
          <span>Total (AUD)</span>
          <span>{pricing.formattedTotal}</span>
        </div>
      </div>
    </div>
  );
}

// ── Inner checkout form (needs Stripe context) ─────────────────
function CheckoutForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const { formState } = useBooking();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Confirm Stripe payment
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (stripeError) {
        setError(stripeError.message ?? 'Payment failed. Please try again.');
        setIsProcessing(false);
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        // Save booking to Supabase
        await confirmBooking(formState, paymentIntent.id);
        onSuccess();
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        options={{
          layout: 'tabs',
        }}
      />

      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        isLoading={isProcessing}
        disabled={!stripe || !elements || isProcessing}
        className="w-full"
      >
        {isProcessing ? 'Processing...' : `Pay ${new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(formState.totalPriceCents / 100)} AUD`}
      </Button>

      <p className="text-center text-xs text-slate-400">
        Secured by Stripe · 256-bit SSL encryption
      </p>
    </form>
  );
}

// ── Success screen ─────────────────────────────────────────────
function SuccessScreen() {
  const { resetBooking, formState } = useBooking();
  return (
    <div className="flex flex-col items-center text-center gap-4 py-8">
      <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
        <CheckCircle2 className="w-10 h-10 text-emerald-600" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Booking Confirmed!</h2>
        <p className="text-slate-500 text-sm mt-2 max-w-xs">
          Your {formState.tier} clean has been booked. We'll SMS you with your pro's details 24 hours before.
        </p>
      </div>
      <div className="bg-emerald-50 rounded-2xl p-4 w-full text-sm text-emerald-800 space-y-1">
        <p className="font-semibold">What happens next?</p>
        <p>✓ Confirmation email sent</p>
        <p>✓ Pro assigned within 2 hours</p>
        <p>✓ SMS reminder day before</p>
      </div>
      <Button variant="secondary" onClick={resetBooking} className="w-full">
        Book Another Service
      </Button>
    </div>
  );
}

// ── Main exported component ────────────────────────────────────
export function StepCheckout() {
  const { formState, prevStep } = useBooking();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [isLoadingIntent, setIsLoadingIntent] = useState(true);
  const [intentError, setIntentError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const fetchIntent = useCallback(async () => {
    setIsLoadingIntent(true);
    setIntentError(null);
    try {
      const { clientSecret: cs, id } = await createPaymentIntent(
        formState.totalPriceCents,
        {
          tier: formState.tier ?? '',
          suburb: formState.suburb,
          date: formState.date,
        }
      );
      setClientSecret(cs);
      setPaymentIntentId(id);
    } catch {
      setIntentError('Could not initialise payment. Please try again.');
    } finally {
      setIsLoadingIntent(false);
    }
  }, [formState.totalPriceCents, formState.tier, formState.suburb, formState.date]);

  useEffect(() => {
    fetchIntent();
  }, [fetchIntent]);

  if (isSuccess) return <SuccessScreen />;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Review & Pay</h2>
        <p className="text-slate-500 text-sm mt-1">
          Your booking is held for 10 minutes while you complete payment.
        </p>
      </div>

      <BookingSummary />

      {isLoadingIntent ? (
        <div className="flex items-center justify-center py-10 gap-3 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Preparing secure checkout...</span>
        </div>
      ) : intentError ? (
        <div className="flex flex-col items-center gap-3 py-6">
          <p className="text-sm text-red-600">{intentError}</p>
          <Button variant="secondary" onClick={fetchIntent}>
            Try Again
          </Button>
        </div>
      ) : clientSecret ? (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: 'stripe',
              variables: {
                colorPrimary: '#059669',
                borderRadius: '12px',
                fontFamily: 'system-ui, sans-serif',
              },
            },
          }}
        >
          <CheckoutForm onSuccess={() => setIsSuccess(true)} />
        </Elements>
      ) : null}

      {!isSuccess && (
        <Button variant="ghost" onClick={prevStep} className="w-full text-slate-500">
          Back to Schedule
        </Button>
      )}
    </div>
  );
}
