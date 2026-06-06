'use client';

import { useState } from 'react';
import {
  LayoutDashboard,
  TruckIcon,
  ShieldCheck,
  LogOut,
  RefreshCw,
  Star,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { getAllReviews } from '@/app/actions/bookings';

type ReviewRow = Awaited<ReturnType<typeof getAllReviews>>[number];

type FilterTab = 'all' | '5' | '4' | '3' | 'low';

function StarRow({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const cls = size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(cls, i <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200')}
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

export function ReviewsPanel({ initialReviews }: { initialReviews: ReviewRow[] }) {
  const [reviews, setReviews] = useState<ReviewRow[]>(initialReviews);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const total = reviews.length;
  const avg = total > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
  const fiveStars = reviews.filter((r) => r.rating === 5).length;
  const lowRatings = reviews.filter((r) => r.rating <= 2).length;

  const filtered =
    activeFilter === 'all'
      ? reviews
      : activeFilter === 'low'
      ? reviews.filter((r) => r.rating <= 2)
      : reviews.filter((r) => r.rating === Number(activeFilter));

  const handleSignOut = async () => {
    await fetch('/api/admin-auth', { method: 'DELETE' });
    window.location.href = '/admin/login';
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const fresh = await getAllReviews();
      setReviews(fresh);
    } finally {
      setIsRefreshing(false);
    }
  };

  const tabs: { key: FilterTab; label: string; count: number; color?: string }[] = [
    { key: 'all', label: 'All', count: total },
    { key: '5', label: '5 Stars', count: reviews.filter((r) => r.rating === 5).length },
    { key: '4', label: '4 Stars', count: reviews.filter((r) => r.rating === 4).length },
    { key: '3', label: '3 Stars', count: reviews.filter((r) => r.rating === 3).length },
    { key: 'low', label: '1–2 Stars', count: lowRatings, color: 'text-red-600' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top nav */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            <div>
              <h1 className="text-lg font-bold text-slate-900">Reviews</h1>
              <p className="text-xs text-slate-400">Urban Clap AU</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/admin"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
            <a
              href="/admin/dispatch"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <TruckIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Dispatch</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
            <a
              href="/admin/contractors"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Contractors</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
            <Button variant="secondary" size="sm" onClick={handleRefresh} isLoading={isRefreshing}>
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button variant="secondary" size="sm" onClick={handleSignOut}>
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            </div>
            <p className="text-xs text-slate-500">Average Rating</p>
            <p className="text-xl font-bold text-slate-900">
              {total === 0 ? '—' : avg.toFixed(1)}
              {total > 0 && <span className="text-sm font-normal text-slate-400"> / 5</span>}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col gap-2">
            <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-violet-600" />
            </div>
            <p className="text-xs text-slate-500">Total Reviews</p>
            <p className="text-xl font-bold text-slate-900">{total}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Star className="w-5 h-5 text-emerald-600 fill-emerald-600" />
            </div>
            <p className="text-xs text-slate-500">5-Star Reviews</p>
            <p className="text-xl font-bold text-slate-900">{fiveStars}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col gap-2">
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
              <Star className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-xs text-slate-500">Low Ratings (1–2★)</p>
            <p className="text-xl font-bold text-slate-900">{lowRatings}</p>
          </div>
        </div>

        {/* Rating distribution bar */}
        {total > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2.5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Rating Distribution
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

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5',
                activeFilter === tab.key
                  ? 'bg-slate-900 text-white'
                  : cn('text-slate-600 hover:bg-slate-100', tab.color)
              )}
            >
              {tab.label}
              <span
                className={cn(
                  'text-xs px-1.5 py-0.5 rounded-full',
                  activeFilter === tab.key
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-500'
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Reviews table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <Star className="w-8 h-8 text-slate-300" />
              <p className="text-sm text-slate-400">No reviews in this category.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Customer
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">
                      Location
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">
                      Tier
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Rating
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">
                      Comment
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((r) => {
                    const booking = r.bookings as any;
                    const profile = r.profiles as any;
                    const tier = booking?.services?.tier ?? '—';
                    return (
                      <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {profile?.full_name ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">
                          {booking?.suburb ?? '—'}{booking?.postcode ? ` ${booking.postcode}` : ''}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {tier !== '—' ? (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              {tier}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <StarRow rating={r.rating} />
                        </td>
                        <td className="px-4 py-3 text-slate-500 hidden lg:table-cell max-w-xs truncate">
                          {r.comment ? (
                            <span className="italic">"{r.comment}"</span>
                          ) : (
                            <span className="text-slate-300">No comment</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs hidden md:table-cell whitespace-nowrap">
                          {formatDate(r.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
