'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Briefcase, Clock, DollarSign, Gift, User,
  Copy, Check, Sparkles,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { saveBankDetails } from '@/app/actions/contractor';
import { calculatePrice } from '@/hooks/usePricingCalculator';
import { cn } from '@/lib/utils';
import type { Profile, ServiceTier } from '@/types';
import { TIER_BADGE_COLORS } from '@/types';

type Tab = 'jobs' | 'history' | 'earnings' | 'referral' | 'account';
type HistoryFilter = 'all' | 'completed' | 'cancelled';

interface JobRow {
  id: string;
  address: string;
  suburb: string;
  postcode: string;
  scheduled_datetime: string;
  status: string;
  total_price_cents: number;
  bedrooms_count: number;
  bathrooms_count: number;
  services: { tier: ServiceTier; category_name: string } | null;
  profiles: { full_name: string | null; phone_number: string | null } | null;
}

interface Props {
  profile: Profile | null;
  newJobs: JobRow[];
  history: JobRow[];
  totalEarningsCents: number;
  avgRating: string | null;
  email: string | null;
  referralCode: string;
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('en-AU', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-AU', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  });
}

function centsToAUD(cents: number) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency', currency: 'AUD', minimumFractionDigits: 2,
  }).format(cents / 100);
}

function initials(name: string | null) {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

function TierBadge({ tier }: { tier: ServiceTier }) {
  return (
    <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full border', TIER_BADGE_COLORS[tier])}>
      {tier}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="p-1.5 rounded-lg hover:bg-slate-100 transition text-slate-500"
      title="Copy"
    >
      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

export function ContractorDashboard({
  profile, newJobs, history, totalEarningsCents, avgRating, email, referralCode,
}: Props) {
  const [tab, setTab] = useState<Tab>('jobs');
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('all');
  const [bsb, setBsb] = useState(profile?.bank_bsb ?? '');
  const [accountNumber, setAccountNumber] = useState(profile?.bank_account_number ?? '');
  const [bankSaving, setBankSaving] = useState(false);
  const [bankSaved, setBankSaved] = useState(false);
  const [bankError, setBankError] = useState('');

  const name = profile?.full_name ?? 'Contractor';
  const shareUrl = `https://urban-clap-au-jet.vercel.app/contractor/signup?ref=${referralCode}`;

  const filteredHistory = history.filter((j) => {
    if (historyFilter === 'all') return true;
    return j.status === historyFilter;
  });

  const handleSaveBankDetails = async () => {
    setBankSaving(true);
    setBankError('');
    setBankSaved(false);
    try {
      await saveBankDetails(bsb, accountNumber);
      setBankSaved(true);
    } catch (err: unknown) {
      setBankError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setBankSaving(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/contractor/login';
  };

  const navItems: { id: Tab; icon: React.ReactNode; label: string }[] = [
    { id: 'jobs',     icon: <Briefcase className="w-5 h-5" />,   label: 'New Jobs' },
    { id: 'history',  icon: <Clock className="w-5 h-5" />,       label: 'History' },
    { id: 'earnings', icon: <DollarSign className="w-5 h-5" />,  label: 'Earnings' },
    { id: 'referral', icon: <Gift className="w-5 h-5" />,        label: 'Refer & Earn' },
    { id: 'account',  icon: <User className="w-5 h-5" />,        label: 'Account' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col sm:flex-row">
      {/* Sidebar — desktop only */}
      <aside className="hidden sm:flex flex-col w-56 bg-white border-r border-slate-200 sticky top-0 h-screen">
        <div className="p-4 border-b border-slate-100">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-extrabold text-slate-900 text-sm">Urban Clap AU</span>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition text-left',
                tab === item.id
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100',
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col pb-20 sm:pb-0">
        {/* Profile header */}
        <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-teal-600 flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-lg">{initials(name)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-extrabold text-slate-900 truncate">{name}</p>
              <p className="text-xs text-slate-500 truncate">{email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full">
              ⭐ {avgRating ?? '—'}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-1 rounded-full">
              {newJobs.length} upcoming
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-full">
              {centsToAUD(totalEarningsCents)} earned
            </span>
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 px-4 sm:px-6 py-6 max-w-2xl w-full mx-auto sm:mx-0">
          {tab === 'jobs' && <JobsTab jobs={newJobs} />}
          {tab === 'history' && (
            <HistoryTab
              jobs={filteredHistory}
              filter={historyFilter}
              setFilter={setHistoryFilter}
            />
          )}
          {tab === 'earnings' && (
            <EarningsTab
              totalEarningsCents={totalEarningsCents}
              history={history}
              bsb={bsb}
              setBsb={setBsb}
              accountNumber={accountNumber}
              setAccountNumber={setAccountNumber}
              onSave={handleSaveBankDetails}
              saving={bankSaving}
              saved={bankSaved}
              error={bankError}
            />
          )}
          {tab === 'referral' && (
            <ReferralTab referralCode={referralCode} shareUrl={shareUrl} />
          )}
          {tab === 'account' && (
            <AccountTab profile={profile} email={email} onSignOut={handleSignOut} />
          )}
        </div>
      </div>

      {/* Bottom nav — mobile only */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-30">
        <div className="flex">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={cn(
                'flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-semibold transition border-t-2',
                tab === item.id
                  ? 'text-teal-600 border-teal-600'
                  : 'text-slate-500 border-transparent',
              )}
            >
              {item.icon}
              <span className="text-[10px]">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

function JobsTab({ jobs }: { jobs: JobRow[] }) {
  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <Briefcase className="w-12 h-12 text-slate-300" />
        <p className="font-semibold text-slate-500">No upcoming jobs.</p>
        <p className="text-sm text-slate-400">Check back soon!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-extrabold text-slate-900 text-lg">Upcoming Jobs</h2>
      {jobs.map((job) => {
        const tier = job.services?.tier ?? 'Silver';
        const categoryName = job.services?.category_name ?? 'Service';
        const pricing = calculatePrice(job.bedrooms_count, job.bathrooms_count, tier);
        return (
          <div key={job.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <TierBadge tier={tier} />
              <span className="text-sm font-semibold text-slate-700">{categoryName}</span>
            </div>
            <div className="space-y-1.5 text-sm text-slate-600">
              <p>📅 {formatDateTime(job.scheduled_datetime)}</p>
              <p>📍 {job.address}, {job.suburb} {job.postcode}</p>
              {job.profiles?.full_name && <p>👤 {job.profiles.full_name}</p>}
              {job.profiles?.phone_number && (
                <p>
                  📞{' '}
                  <a
                    href={`tel:${job.profiles.phone_number}`}
                    className="text-teal-600 font-semibold hover:text-teal-700"
                  >
                    {job.profiles.phone_number}
                  </a>
                </p>
              )}
              <p className="text-slate-500">
                🛏 {job.bedrooms_count} bed · 🚿 {job.bathrooms_count} bath
              </p>
              <p className="font-semibold text-teal-700">
                💰 {pricing.formattedContractorPayout} your earnings (80%)
              </p>
            </div>
            <Link
              href={`/contractor/jobs/${job.id}`}
              className="inline-flex items-center gap-1 text-sm font-semibold text-teal-600 hover:text-teal-700 transition"
            >
              View Job Details →
            </Link>
          </div>
        );
      })}
    </div>
  );
}

function HistoryTab({
  jobs, filter, setFilter,
}: {
  jobs: JobRow[];
  filter: HistoryFilter;
  setFilter: (f: HistoryFilter) => void;
}) {
  const filters: { id: HistoryFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="space-y-4">
      <h2 className="font-extrabold text-slate-900 text-lg">Job History</h2>
      <div className="flex gap-2">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-semibold transition',
              filter === f.id
                ? 'bg-teal-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
      {jobs.length === 0 ? (
        <p className="text-slate-500 text-sm py-8 text-center">No jobs to show.</p>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => {
            const tier = job.services?.tier ?? 'Silver';
            const categoryName = job.services?.category_name ?? 'Service';
            const isCompleted = job.status === 'completed';
            const pricing = isCompleted
              ? calculatePrice(job.bedrooms_count, job.bathrooms_count, tier)
              : null;
            return (
              <div key={job.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={cn(
                        'text-xs font-bold px-2 py-0.5 rounded-full border',
                        isCompleted
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-red-50 text-red-700 border-red-200',
                      )}
                    >
                      {isCompleted ? 'Completed' : 'Cancelled'}
                    </span>
                    <TierBadge tier={tier} />
                    <span className="text-xs text-slate-500">{categoryName}</span>
                  </div>
                  <p className="text-sm text-slate-600">{formatDateShort(job.scheduled_datetime)}</p>
                  <p className="text-sm text-slate-500">{job.suburb} {job.postcode}</p>
                </div>
                {pricing && (
                  <p className="text-sm font-bold text-teal-700 shrink-0">
                    {pricing.formattedContractorPayout}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EarningsTab({
  totalEarningsCents, history, bsb, setBsb, accountNumber, setAccountNumber,
  onSave, saving, saved, error,
}: {
  totalEarningsCents: number;
  history: JobRow[];
  bsb: string;
  setBsb: (v: string) => void;
  accountNumber: string;
  setAccountNumber: (v: string) => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
  error: string;
}) {
  const completed = history.filter((j) => j.status === 'completed');

  return (
    <div className="space-y-6">
      <h2 className="font-extrabold text-slate-900 text-lg">Earnings</h2>

      <div className="bg-teal-600 rounded-2xl p-6 text-white">
        <p className="text-sm font-semibold text-teal-100">Total Earned</p>
        <p className="text-4xl font-extrabold mt-1">{centsToAUD(totalEarningsCents)}</p>
        <p className="text-xs text-teal-200 mt-1">From {completed.length} completed jobs</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <p className="font-bold text-slate-800">Payout Details</p>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">BSB</label>
            <input
              type="text"
              value={bsb}
              onChange={(e) => setBsb(e.target.value)}
              placeholder="062-000"
              maxLength={7}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition bg-white placeholder:text-slate-300"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">Account Number</label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="12345678"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition bg-white placeholder:text-slate-300"
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="bg-teal-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-teal-700 transition disabled:opacity-50 text-sm"
            >
              {saving ? 'Saving…' : 'Save Details'}
            </button>
            {saved && <span className="text-sm text-emerald-600 font-semibold">Saved ✓</span>}
          </div>
        </div>
      </div>

      {completed.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <p className="font-bold text-slate-800 px-5 py-4 border-b border-slate-100">Completed Jobs</p>
          <div className="divide-y divide-slate-100">
            {completed.map((job) => {
              const tier = job.services?.tier ?? 'Silver';
              const pricing = calculatePrice(job.bedrooms_count, job.bathrooms_count, tier);
              return (
                <div key={job.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <div>
                    <p className="font-medium text-slate-700">{formatDateShort(job.scheduled_datetime)}</p>
                    <p className="text-slate-400 text-xs">{job.suburb} {job.postcode}</p>
                  </div>
                  <p className="font-bold text-teal-700">{pricing.formattedContractorPayout}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ReferralTab({ referralCode, shareUrl }: { referralCode: string; shareUrl: string }) {
  return (
    <div className="space-y-6">
      <h2 className="font-extrabold text-slate-900 text-lg">Refer &amp; Earn</h2>

      <div className="bg-teal-600 rounded-2xl p-6 text-white space-y-4">
        <p className="text-xl font-extrabold">Earn $50 per referral</p>

        <div>
          <p className="text-xs text-teal-200 font-semibold mb-1.5">Your referral code</p>
          <div className="flex items-center gap-2 bg-teal-700 rounded-xl px-4 py-2.5">
            <span className="font-mono font-bold text-lg flex-1">{referralCode}</span>
            <CopyButton text={referralCode} />
          </div>
        </div>

        <div>
          <p className="text-xs text-teal-200 font-semibold mb-1.5">Share link</p>
          <div className="flex items-center gap-2 bg-teal-700 rounded-xl px-4 py-2.5">
            <span className="text-xs truncate flex-1 text-teal-100">{shareUrl}</span>
            <CopyButton text={shareUrl} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <p className="font-bold text-slate-800">How it works</p>
        <div className="space-y-3">
          {[
            'Share your code with other cleaners/tradies',
            'They sign up and complete their first job',
            'You earn $50 AUD deposited to your account',
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold shrink-0">
                {i + 1}
              </div>
              <p className="text-sm text-slate-600">{step}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 border-t border-slate-100 pt-3">
          Referral bonuses are processed within 7 business days of your referred contractor completing their first job.
        </p>
      </div>
    </div>
  );
}

function AccountTab({
  profile, email, onSignOut,
}: {
  profile: Profile | null;
  email: string | null;
  onSignOut: () => void;
}) {
  const categories = profile?.contractor_categories ?? [];
  const postcodes = profile?.service_postcodes ?? [];

  return (
    <div className="space-y-6">
      <h2 className="font-extrabold text-slate-900 text-lg">Account</h2>

      <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
        <Row label="Name" value={profile?.full_name ?? '—'} />
        <Row label="Email" value={email ?? '—'} />
        <Row label="Phone" value={profile?.phone_number ?? '—'} />
        <Row label="ABN" value={profile?.abn ?? '—'} />
        {profile?.insurance_expiry && (
          <Row label="Insurance Expiry" value={profile.insurance_expiry} />
        )}
        {profile?.experience_years != null && (
          <Row label="Experience" value={`${profile.experience_years} year${profile.experience_years !== 1 ? 's' : ''}`} />
        )}
        {categories.length > 0 && (
          <div className="px-5 py-3.5 flex items-start gap-3">
            <span className="text-sm text-slate-500 w-32 shrink-0">Services</span>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((c) => (
                <span key={c} className="text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full">
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}
        {postcodes.length > 0 && (
          <div className="px-5 py-3.5 flex items-start gap-3">
            <span className="text-sm text-slate-500 w-32 shrink-0">Postcodes</span>
            <div className="flex flex-wrap gap-1.5">
              {postcodes.map((p) => (
                <span key={p} className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onSignOut}
        className="w-full border border-red-200 text-red-600 font-semibold py-3 rounded-xl hover:bg-red-50 transition text-sm"
      >
        Sign Out
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-5 py-3.5 flex items-center gap-3">
      <span className="text-sm text-slate-500 w-32 shrink-0">{label}</span>
      <span className="text-sm font-medium text-slate-800">{value}</span>
    </div>
  );
}
