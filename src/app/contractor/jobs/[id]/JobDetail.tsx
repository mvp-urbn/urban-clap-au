'use client';

import { useState, useTransition } from 'react';
import { MapPin, LocateFixed, KeyRound, CheckCircle2, Loader2 } from 'lucide-react';
import { contractorCheckIn, verifyJobOtp } from '@/app/actions/contractor';
import type { Booking, ServiceTier } from '@/types';
import { calculatePrice } from '@/hooks/usePricingCalculator';
import { cn } from '@/lib/utils';

type JobWithJoins = Booking & {
  services: { tier: ServiceTier; category_name: string } | null;
  profiles: { full_name: string | null; phone_number: string | null } | null;
};

export function JobDetail({ job: initialJob }: { job: JobWithJoins }) {
  const [job, setJob] = useState(initialJob);
  const [isPending, startTransition] = useTransition();
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'locating' | 'done' | 'error'>('idle');
  const [gpsError, setGpsError] = useState('');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpPending, startOtpTransition] = useTransition();

  const tier = job.services?.tier ?? 'Silver';
  const pricing = calculatePrice(job.bedrooms_count, job.bathrooms_count, tier);
  const customerName = job.profiles?.full_name ?? 'Customer';
  const customerPhone = job.profiles?.phone_number;
  const isCheckedIn = !!job.checked_in_at;
  const isActive = job.status === 'assigned';

  const handleCheckIn = () => {
    setGpsStatus('locating');
    setGpsError('');

    const doCheckIn = (lat: number | null, lng: number | null) => {
      startTransition(async () => {
        try {
          await contractorCheckIn(job.id, lat, lng);
          setJob((prev) => ({ ...prev, checked_in_at: new Date().toISOString() }));
          setGpsStatus('done');
        } catch (err: unknown) {
          setGpsError(err instanceof Error ? err.message : 'Check-in failed');
          setGpsStatus('error');
        }
      });
    };

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => doCheckIn(pos.coords.latitude, pos.coords.longitude),
        () => {
          // GPS denied — check in without coordinates
          doCheckIn(null, null);
        },
        { timeout: 8000 }
      );
    } else {
      doCheckIn(null, null);
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    startOtpTransition(async () => {
      try {
        await verifyJobOtp(job.id, otp);
        setOtpVerified(true);
        setJob((prev) => ({ ...prev, checked_in_at: prev.checked_in_at ?? new Date().toISOString() }));
      } catch (err: unknown) {
        setOtpError(err instanceof Error ? err.message : 'Verification failed');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Pay breakdown */}
      <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-teal-600 font-semibold uppercase tracking-wide">Your earnings</p>
          <p className="text-3xl font-extrabold text-teal-700 mt-0.5">{pricing.formattedContractorPayout} AUD</p>
          <p className="text-xs text-teal-500 mt-0.5">80% of {pricing.formattedTotal} customer payment</p>
        </div>
        <div className="text-right text-sm text-teal-700">
          <p>{job.bedrooms_count} bed · {job.bathrooms_count} bath</p>
          <p className="font-semibold">{tier} clean</p>
        </div>
      </div>

      {/* Customer info */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Customer</h2>
        <p className="font-semibold text-slate-800">{customerName}</p>
        {customerPhone && (
          <a
            href={`tel:${customerPhone}`}
            className="inline-flex items-center gap-2 text-sm text-teal-600 hover:text-teal-800 font-semibold"
          >
            📞 {customerPhone}
          </a>
        )}
        <div className="flex items-start gap-2 text-sm text-slate-600">
          <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-slate-800">{job.address}</p>
            <p className="text-slate-400">{job.suburb} {job.postcode}</p>
          </div>
        </div>
        <a
          href={`https://maps.google.com/?q=${encodeURIComponent(`${job.address}, ${job.suburb} ${job.postcode}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-teal-600 underline-offset-2 underline transition"
        >
          <MapPin className="w-3.5 h-3.5" />
          Open in Google Maps
        </a>
      </div>

      {/* Check-in section */}
      {isActive && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Proof of Arrival</h2>

          {/* GPS check-in */}
          <div>
            <p className="text-sm text-slate-600 mb-3">
              Step 1 — Confirm you&apos;re on-site by checking in with your location.
            </p>
            {isCheckedIn ? (
              <div className="flex items-center gap-2 text-sm text-emerald-700 font-semibold">
                <CheckCircle2 className="w-5 h-5" />
                Checked in{' '}
                {job.checked_in_at
                  ? new Date(job.checked_in_at).toLocaleTimeString('en-AU', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : ''}
              </div>
            ) : (
              <div>
                <button
                  onClick={handleCheckIn}
                  disabled={isPending || gpsStatus === 'locating'}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition',
                    'bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  {gpsStatus === 'locating' || isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LocateFixed className="w-4 h-4" />
                  )}
                  {gpsStatus === 'locating' ? 'Getting location…' : 'Check In'}
                </button>
                {gpsError && (
                  <p className="text-xs text-red-600 mt-2">{gpsError}</p>
                )}
                <p className="text-xs text-slate-400 mt-2">
                  We&apos;ll request your location. If denied, check-in still works — we log the timestamp.
                </p>
              </div>
            )}
          </div>

          <hr className="border-slate-100" />

          {/* OTP verification */}
          <div>
            <p className="text-sm text-slate-600 mb-3">
              Step 2 — Ask the customer for their 6-digit access code and enter it below.
            </p>
            {otpVerified ? (
              <div className="flex items-center gap-2 text-sm text-emerald-700 font-semibold">
                <CheckCircle2 className="w-5 h-5" />
                OTP verified — you&apos;re confirmed for this job!
              </div>
            ) : (
              <form onSubmit={handleVerifyOtp} className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-32 border border-slate-200 rounded-xl px-3 py-2.5 text-center text-lg font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button
                  type="submit"
                  disabled={otp.length !== 6 || otpPending}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-semibold hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  {otpPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <KeyRound className="w-4 h-4" />
                  )}
                  Verify
                </button>
              </form>
            )}
            {otpError && (
              <p className="text-xs text-red-600 mt-2">{otpError}</p>
            )}
          </div>
        </div>
      )}

      {/* Completed state */}
      {job.status === 'completed' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
          <div>
            <p className="font-semibold text-emerald-800">Job completed</p>
            <p className="text-xs text-emerald-600 mt-0.5">Payment will be processed within 3 business days.</p>
          </div>
        </div>
      )}
    </div>
  );
}
