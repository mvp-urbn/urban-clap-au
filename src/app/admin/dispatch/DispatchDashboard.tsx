'use client';

import { useState, useEffect, useRef } from 'react';
import {
  ClipboardCopy,
  CheckCheck,
  MapPin,
  Calendar,
  User,
  DollarSign,
  Package,
  RefreshCw,
  LogOut,
  UserPlus,
  CheckCircle2,
  FlaskConical,
  Copy,
} from 'lucide-react';
import { Booking, TIER_BADGE_COLORS } from '@/types';
import { calculatePrice } from '@/hooks/usePricingCalculator';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { getActiveBookings, updateBookingStatus } from '@/app/actions/bookings';
import { createClient } from '@/lib/supabase/client';

interface DispatchDashboardProps {
  initialBookings: Booking[];
}

function formatDateTime(dt: string) {
  const d = new Date(dt);
  return d.toLocaleString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function buildSMSText(booking: Booking): string {
  const tier = (booking as any).services?.tier ?? 'Standard';
  const suburb = booking.suburb;
  const dt = new Date(booking.scheduled_datetime);
  const dayTime = dt.toLocaleString('en-AU', {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const pricing = calculatePrice(booking.bedrooms_count, booking.bathrooms_count, tier);
  const earn = pricing.formattedContractorPayout;
  return `URGENT JOB: ${tier} Clean in ${suburb}. ${dayTime}. Earn ${earn} AUD. Reply YES to claim. Questions? Call us: [PHONE]`;
}

function PendingCard({
  booking,
  onMarkAssigned,
  isUpdating,
}: {
  booking: Booking;
  onMarkAssigned: () => void;
  isUpdating: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const tier = (booking as any).services?.tier ?? 'Silver';
  const customerName = (booking as any).profiles?.full_name ?? 'Customer';
  const tierColor = TIER_BADGE_COLORS[tier as keyof typeof TIER_BADGE_COLORS] ?? '';
  const pricing = calculatePrice(booking.bedrooms_count, booking.bathrooms_count, tier);

  const handleCopySMS = async () => {
    const sms = buildSMSText(booking);
    try {
      await navigator.clipboard.writeText(sms);
    } catch {
      const el = document.createElement('textarea');
      el.value = sms;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full border', tierColor)}>
          {tier} Clean
        </span>
        <span className="text-xs text-slate-400">#{booking.id.slice(0, 8).toUpperCase()}</span>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <User className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="font-semibold text-slate-800">{customerName}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            {booking.address}, <strong>{booking.suburb}</strong> {booking.postcode}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
          <span>{formatDateTime(booking.scheduled_datetime)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Package className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            {booking.bedrooms_count} bed · {booking.bathrooms_count} bath
          </span>
        </div>

        <div className="bg-slate-50 rounded-xl p-3 space-y-1 text-sm">
          <div className="flex justify-between text-slate-500">
            <span>Customer pays</span>
            <span className="font-semibold text-slate-800">{pricing.formattedTotal} AUD</span>
          </div>
          <div className="flex justify-between text-emerald-600">
            <span className="flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5" />
              Contractor earns (80%)
            </span>
            <span className="font-bold">{pricing.formattedContractorPayout} AUD</span>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-3 text-xs text-slate-300 font-mono leading-relaxed">
          {buildSMSText(booking)}
        </div>

        <div className="flex gap-2">
          <Button
            variant={copied ? 'secondary' : 'primary'}
            size="sm"
            onClick={handleCopySMS}
            className="flex-1"
          >
            {copied ? (
              <>
                <CheckCheck className="w-4 h-4 text-emerald-600" />
                Copied!
              </>
            ) : (
              <>
                <ClipboardCopy className="w-4 h-4" />
                Copy SMS
              </>
            )}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onMarkAssigned}
            isLoading={isUpdating}
            className="flex-1 !border-blue-200 !text-blue-700 hover:!bg-blue-50"
          >
            <UserPlus className="w-4 h-4" />
            Mark Assigned
          </Button>
        </div>
      </div>
    </div>
  );
}

function AssignedCard({
  booking,
  onMarkCompleted,
  isUpdating,
}: {
  booking: Booking;
  onMarkCompleted: () => void;
  isUpdating: boolean;
}) {
  const tier = (booking as any).services?.tier ?? 'Silver';
  const customerName = (booking as any).profiles?.full_name ?? 'Customer';
  const tierColor = TIER_BADGE_COLORS[tier as keyof typeof TIER_BADGE_COLORS] ?? '';
  const pricing = calculatePrice(booking.bedrooms_count, booking.bathrooms_count, tier);

  return (
    <div className="bg-white rounded-2xl border border-blue-200 shadow-sm overflow-hidden">
      <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full border', tierColor)}>
            {tier} Clean
          </span>
          <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
            In Progress
          </span>
        </div>
        <span className="text-xs text-slate-400">#{booking.id.slice(0, 8).toUpperCase()}</span>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <User className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="font-semibold text-slate-800">{customerName}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            {booking.address}, <strong>{booking.suburb}</strong> {booking.postcode}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
          <span>{formatDateTime(booking.scheduled_datetime)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Package className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            {booking.bedrooms_count} bed · {booking.bathrooms_count} bath ·{' '}
            <strong>{pricing.formattedTotal} AUD</strong>
          </span>
        </div>

        {(booking as any).checkin_otp && (
          <div className="flex items-center justify-between bg-teal-50 border border-teal-200 rounded-xl px-3 py-2">
            <span className="text-xs font-semibold text-teal-600">Customer OTP</span>
            <span className="font-mono font-extrabold text-teal-800 tracking-widest text-base">
              {(booking as any).checkin_otp}
            </span>
          </div>
        )}

        {(booking as any).checked_in_at && (
          <p className="text-xs text-emerald-600 font-semibold">
            ✓ Contractor checked in at{' '}
            {new Date((booking as any).checked_in_at).toLocaleTimeString('en-AU', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}

        <Button
          variant="secondary"
          size="sm"
          onClick={onMarkCompleted}
          isLoading={isUpdating}
          className="w-full !border-emerald-200 !text-emerald-700 hover:!bg-emerald-50"
        >
          <CheckCircle2 className="w-4 h-4" />
          Mark as Completed
        </Button>
      </div>
    </div>
  );
}

export function DispatchDashboard({ initialBookings }: DispatchDashboardProps) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('dispatch-bookings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        async () => {
          const fresh = await getActiveBookings();
          setBookings(fresh ?? []);
        }
      )
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Seed panel state
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<{ email: string; password: string } | null>(null);
  const [seedError, setSeedError] = useState('');
  const [credCopied, setCredCopied] = useState(false);

  const pending = bookings.filter((b) => b.status === 'pending_dispatch');
  const assigned = bookings.filter((b) => b.status === 'assigned');

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const fresh = await getActiveBookings();
      setBookings(fresh ?? []);
    } catch {
      // silently fail — stale data is still usable
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSignOut = async () => {
    await fetch('/api/admin-auth', { method: 'DELETE' });
    window.location.href = '/admin/login';
  };

  const handleMarkAssigned = async (id: string) => {
    setUpdatingId(id);
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: 'assigned' as const } : b))
    );
    try {
      await updateBookingStatus(id, 'assigned');
    } catch {
      // revert on failure
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: 'pending_dispatch' as const } : b))
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleMarkCompleted = async (id: string) => {
    setUpdatingId(id);
    setBookings((prev) => prev.filter((b) => b.id !== id));
    try {
      await updateBookingStatus(id, 'completed');
    } catch {
      // on failure, refresh to restore state
      const fresh = await getActiveBookings();
      setBookings(fresh ?? []);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    setSeedError('');
    setSeedResult(null);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Seed failed');
      setSeedResult({ email: json.email, password: json.password });
      // Refresh bookings to show newly seeded ones
      const fresh = await getActiveBookings();
      setBookings(fresh ?? []);
    } catch (e: any) {
      setSeedError(e.message ?? 'Seed failed');
    } finally {
      setSeeding(false);
    }
  };

  const handleCopyCredentials = async () => {
    if (!seedResult) return;
    const text = `Email: ${seedResult.email}\nPassword: ${seedResult.password}`;
    await navigator.clipboard.writeText(text).catch(() => {});
    setCredCopied(true);
    setTimeout(() => setCredCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top nav */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Dispatch Console</h1>
            <p className="text-xs text-slate-400">Urban Clap AU · Admin Only</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1 border',
                isLive
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-amber-50 border-amber-200'
              )}
            >
              <span
                className={cn(
                  'w-2 h-2 rounded-full animate-pulse',
                  isLive ? 'bg-emerald-500' : 'bg-amber-500'
                )}
              />
              <span
                className={cn(
                  'text-xs font-semibold',
                  isLive ? 'text-emerald-700' : 'text-amber-700'
                )}
              >
                {isLive ? 'Live · ' : ''}{pending.length} Pending
              </span>
            </div>
            <Button variant="secondary" size="sm" onClick={handleSeed} isLoading={seeding}>
              <FlaskConical className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Seed Test Data</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefresh}
              isLoading={isRefreshing}
            >
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

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
        {/* Seed result panel */}
        {(seedResult || seedError) && (
          <div
            className={cn(
              'rounded-2xl border p-4 text-sm space-y-2',
              seedError
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-emerald-50 border-emerald-200'
            )}
          >
            {seedError ? (
              <p>{seedError}</p>
            ) : (
              <>
                <p className="font-semibold text-emerald-800">Test data seeded! Sign in as the test customer:</p>
                <div className="bg-white rounded-xl border border-emerald-200 px-4 py-3 font-mono text-xs space-y-1">
                  <p><span className="text-slate-400">Email:</span> {seedResult!.email}</p>
                  <p><span className="text-slate-400">Pass: </span> {seedResult!.password}</p>
                </div>
                <button
                  onClick={handleCopyCredentials}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                >
                  {credCopied ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {credCopied ? 'Copied!' : 'Copy credentials'}
                </button>
                <p className="text-xs text-emerald-700">
                  Go to <strong>/auth/login</strong>, sign in, then visit <strong>/bookings</strong> to see the 2 test jobs.
                </p>
              </>
            )}
          </div>
        )}

        {/* Pending Dispatch section */}
        <section>
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">
            Pending Dispatch
            {pending.length > 0 && (
              <span className="ml-2 text-xs font-semibold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full normal-case tracking-normal">
                {pending.length} job{pending.length !== 1 ? 's' : ''}
              </span>
            )}
          </h2>

          {pending.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-3 bg-white rounded-2xl border border-slate-200">
              <CheckCheck className="w-8 h-8 text-emerald-500" />
              <p className="text-sm text-slate-500">No jobs waiting for dispatch.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">
                Copy the SMS and send via your broadcast tool. Once a contractor claims it, click{' '}
                <strong>Mark Assigned</strong>.
              </p>
              {pending.map((b) => (
                <PendingCard
                  key={b.id}
                  booking={b}
                  onMarkAssigned={() => handleMarkAssigned(b.id)}
                  isUpdating={updatingId === b.id}
                />
              ))}
            </div>
          )}
        </section>

        {/* In Progress section */}
        {assigned.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">
              In Progress
              <span className="ml-2 text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full normal-case tracking-normal">
                {assigned.length} job{assigned.length !== 1 ? 's' : ''}
              </span>
            </h2>
            <div className="space-y-4">
              <p className="text-sm text-slate-500">
                Contractor is assigned. Click <strong>Mark as Completed</strong> once the job is done.
              </p>
              {assigned.map((b) => (
                <AssignedCard
                  key={b.id}
                  booking={b}
                  onMarkCompleted={() => handleMarkCompleted(b.id)}
                  isUpdating={updatingId === b.id}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
