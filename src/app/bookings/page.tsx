import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Sparkles,
  CalendarDays,
  MapPin,
  Home,
  ChevronRight,
  ClipboardList,
  UserCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Booking, BookingStatus, Review, ServiceTier } from '@/types';
import { SignOutButton } from '@/components/ui/SignOutButton';
import { ReviewForm } from '@/components/ui/ReviewForm';

const STATUS_CONFIG: Record<BookingStatus, { label: string; classes: string }> = {
  pending_dispatch: { label: 'Pending',   classes: 'bg-amber-100 text-amber-700 border-amber-200' },
  assigned:         { label: 'Confirmed', classes: 'bg-blue-100 text-blue-700 border-blue-200' },
  completed:        { label: 'Completed', classes: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  cancelled:        { label: 'Cancelled', classes: 'bg-red-100 text-red-700 border-red-200' },
};

const TIER_CLASSES: Record<ServiceTier, string> = {
  Silver: 'bg-slate-100 text-slate-700 border-slate-200',
  Gold:   'bg-amber-50 text-amber-700 border-amber-200',
  Pro:    'bg-violet-50 text-violet-700 border-violet-200',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
}

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString('en-AU', { style: 'currency', currency: 'AUD' });
}

function shortId(id: string) {
  return id.replace(/-/g, '').slice(0, 8).toUpperCase();
}

type BookingWithService = Booking & { services: { tier: ServiceTier; category_name: string } | null };

export default async function BookingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?next=/bookings');
  }

  // Use admin client so RLS never blocks the query — user.id comes from the auth
  // token (not user input) so filtering by it is safe.
  const adminSupabase = createAdminClient();

  const { data: bookings, error } = await adminSupabase
    .from('bookings')
    .select('*, services:service_id ( tier, category_name )')
    .eq('customer_id', user.id)
    .order('scheduled_datetime', { ascending: false });

  // Fetch reviews — wrapped in try/catch in case the table doesn't exist yet
  let reviews: Record<string, Pick<Review, 'rating' | 'comment'>> = {};
  try {
    const { data: reviewRows } = await adminSupabase
      .from('reviews')
      .select('booking_id, rating, comment')
      .eq('customer_id', user.id);
    if (reviewRows) {
      reviews = Object.fromEntries(reviewRows.map((r) => [r.booking_id, r]));
    }
  } catch {
    // reviews table may not exist yet — silently skip
  }

  const rows = (bookings ?? []) as BookingWithService[];
  const displayName = (user.user_metadata?.full_name as string | undefined) ?? user.email ?? 'Account';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <nav className="border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-slate-900">Urban Clap AU</span>
          </Link>
          <Link
            href="/book"
            className="bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-emerald-700 transition shadow-sm"
          >
            Book Again
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Heading + user info */}
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-slate-900">My Bookings</h1>
          <p className="text-slate-500 text-sm mt-1">
            {error
              ? ''
              : rows.length === 0
              ? 'No bookings yet.'
              : `${rows.length} booking${rows.length !== 1 ? 's' : ''} found`}
          </p>

          {/* User identity + sign out */}
          <div className="mt-3 inline-flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm shadow-sm">
            <UserCircle className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-slate-600 truncate max-w-[180px] sm:max-w-none">{displayName}</span>
            <span className="text-slate-200">·</span>
            <SignOutButton />
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-sm text-red-700 space-y-1">
            <p className="font-semibold">Could not load bookings.</p>
            <p className="font-mono text-xs opacity-70">{error.message}</p>
          </div>
        )}

        {/* Empty state */}
        {!error && rows.length === 0 && (
          <div className="flex flex-col items-center text-center py-16 sm:py-20 gap-5">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
              <ClipboardList className="w-7 h-7 text-slate-400" />
            </div>
            <div>
              <p className="font-semibold text-slate-700">No bookings yet</p>
              <p className="text-slate-400 text-sm mt-1">Your confirmed bookings will appear here.</p>
            </div>
            <Link
              href="/book"
              className="inline-flex items-center gap-2 bg-emerald-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-emerald-700 transition text-sm"
            >
              Book your first clean
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Booking cards */}
        {!error && rows.length > 0 && (
          <div className="space-y-4">
            {rows.map((booking) => {
              const status = STATUS_CONFIG[booking.status];
              const tier = booking.services?.tier;
              const review = reviews[booking.id] ?? null;

              return (
                <div
                  key={booking.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4"
                >
                  {/* Top row: tier badge + status badge + ref */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      {tier && (
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${TIER_CLASSES[tier]}`}>
                          {tier}
                        </span>
                      )}
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                        {booking.services?.category_name ?? 'Home Cleaning'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${status.classes}`}>
                        {status.label}
                      </span>
                      <span className="text-xs text-slate-300 font-mono">#{shortId(booking.id)}</span>
                    </div>
                  </div>

                  {/* Details grid */}
                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-start gap-2.5 text-slate-600">
                      <CalendarDays className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-slate-800">
                          {formatDate(booking.scheduled_datetime)}
                        </p>
                        <p className="text-slate-400 text-xs">{formatTime(booking.scheduled_datetime)}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 text-slate-600">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-slate-800">{booking.address}</p>
                        <p className="text-slate-400 text-xs">
                          {booking.suburb} {booking.postcode}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 text-slate-600">
                      <Home className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>
                        {booking.bedrooms_count} bed · {booking.bathrooms_count} bath
                      </span>
                    </div>

                    <div className="flex items-end gap-1.5">
                      <span className="text-xl font-extrabold text-slate-900">
                        {formatPrice(booking.total_price_cents)}
                      </span>
                      <span className="text-xs text-slate-400 mb-0.5">AUD incl. GST</span>
                    </div>
                  </div>

                  {/* OTP code — shown on assigned bookings for contractor proof of arrival */}
                  {booking.status === 'assigned' && booking.checkin_otp && (
                    <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide">
                          Access Code
                        </p>
                        <p className="text-xs text-teal-600 mt-0.5">Show this to your cleaner when they arrive</p>
                      </div>
                      <span className="text-2xl font-mono font-extrabold text-teal-800 tracking-widest">
                        {booking.checkin_otp}
                      </span>
                    </div>
                  )}

                  {/* Review section — only for completed bookings */}
                  {booking.status === 'completed' && (
                    <ReviewForm
                      bookingId={booking.id}
                      existingRating={review?.rating ?? null}
                      existingComment={review?.comment ?? null}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
