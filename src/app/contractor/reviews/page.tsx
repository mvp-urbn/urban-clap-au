import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Star, ClipboardList, ChevronLeft, MessageSquare } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getContractorProfile, getContractorReviews } from '@/app/actions/contractor';
import { cn } from '@/lib/utils';

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            'w-4 h-4',
            i <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200',
          )}
        />
      ))}
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default async function ContractorReviewsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login?next=/contractor/reviews');

  const profile = await getContractorProfile();
  if (!profile || profile.role !== 'contractor') redirect('/contractor/onboard');
  if (profile.contractor_status !== 'approved') redirect('/contractor');

  const reviews = await getContractorReviews();

  const total = reviews.length;
  const avg = total > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
  const fiveStars = reviews.filter((r) => r.rating === 5).length;

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link
            href="/contractor/jobs"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Jobs
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900">My Reviews</h1>
          <p className="text-slate-500 text-sm mt-1">
            {total === 0
              ? 'No reviews in the last 15 days.'
              : `${total} review${total !== 1 ? 's' : ''} — last 15 days`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-extrabold text-slate-900">
            {total === 0 ? '—' : avg.toFixed(1)}
          </p>
          {total > 0 && (
            <>
              <StarRow rating={Math.round(avg)} />
              <p className="text-xs text-slate-400 mt-1">{fiveStars} × 5-star</p>
            </>
          )}
        </div>
      </div>

      {/* Rating breakdown */}
      {total > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2.5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Rating Breakdown
          </p>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = reviews.filter((r) => r.rating === star).length;
            const pct = total > 0 ? (count / total) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-1 w-12 shrink-0">
                  <span className="text-xs text-slate-500 w-2">{star}</span>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                </div>
                <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-amber-400 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400 w-6 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Review cards */}
      {total === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3 bg-white rounded-2xl border border-slate-200 text-center">
          <Star className="w-8 h-8 text-slate-300" />
          <p className="text-sm font-semibold text-slate-500">No reviews yet</p>
          <p className="text-xs text-slate-400 max-w-xs">
            Reviews from completed jobs appear here for up to 15 days. Complete more jobs to start
            building your rating.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => {
            const booking = r.bookings as any;
            const tier = booking?.services?.tier ?? null;
            return (
              <div
                key={r.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-3"
              >
                {/* Job info */}
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {tier && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          {tier}
                        </span>
                      )}
                      <span className="text-sm font-semibold text-slate-800">
                        {booking?.suburb ?? '—'}
                        {booking?.postcode ? ` ${booking.postcode}` : ''}
                      </span>
                    </div>
                    {booking?.scheduled_datetime && (
                      <p className="text-xs text-slate-400">
                        <ClipboardList className="w-3 h-3 inline mr-1 -mt-0.5" />
                        Job date: {formatDateTime(booking.scheduled_datetime)}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <StarRow rating={r.rating} />
                    <p className="text-xs text-slate-400 mt-1">
                      Reviewed {formatDate(r.created_at)}
                    </p>
                  </div>
                </div>

                {/* Comment */}
                {r.comment ? (
                  <div className="bg-slate-50 rounded-xl px-4 py-3 flex gap-2.5">
                    <MessageSquare className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-600 italic">"{r.comment}"</p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-300 italic">No written comment left.</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Note about visibility window */}
      <p className="text-xs text-center text-slate-400 pb-4">
        Reviews are visible for up to 15 days · 9 days if the customer has another upcoming booking
      </p>
    </main>
  );
}
