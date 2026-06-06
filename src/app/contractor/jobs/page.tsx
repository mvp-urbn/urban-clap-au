import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CalendarDays, MapPin, Package, ChevronRight, ClipboardList, Star } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getContractorProfile, getContractorJobs } from '@/app/actions/contractor';
import { calculatePrice } from '@/hooks/usePricingCalculator';
import { SignOutButton } from '@/components/ui/SignOutButton';
import type { Booking, BookingStatus, ServiceTier } from '@/types';
import { TIER_BADGE_COLORS } from '@/types';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<BookingStatus, { label: string; classes: string }> = {
  payment_pending:  { label: 'Awaiting Payment', classes: 'bg-slate-100 text-slate-500 border-slate-200' },
  pending_dispatch: { label: 'Pending',          classes: 'bg-amber-100 text-amber-700 border-amber-200' },
  assigned:         { label: 'Your Job',         classes: 'bg-teal-100 text-teal-700 border-teal-200' },
  completed:        { label: 'Completed',        classes: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  cancelled:        { label: 'Cancelled',        classes: 'bg-red-100 text-red-700 border-red-200' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-AU', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
  });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
}

type JobWithJoins = Booking & {
  services: { tier: ServiceTier; category_name: string } | null;
  profiles: { full_name: string | null; phone_number: string | null } | null;
};

export default async function ContractorJobsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login?next=/contractor/jobs');

  const profile = await getContractorProfile();
  if (!profile || profile.role !== 'contractor') redirect('/contractor/onboard');
  if (profile.contractor_status !== 'approved') redirect('/contractor');

  const jobs = (await getContractorJobs()) as JobWithJoins[];
  const active = jobs.filter((j) => j.status === 'assigned');
  const completed = jobs.filter((j) => j.status === 'completed');

  const displayName = profile.full_name ?? user.email ?? 'Contractor';

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">My Jobs</h1>
          <p className="text-slate-500 text-sm mt-1">
            {active.length} active · {completed.length} completed
          </p>
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm shadow-sm">
              <span className="text-slate-600 truncate max-w-[180px]">{displayName}</span>
              <span className="text-slate-200">·</span>
              <SignOutButton />
            </div>
            <Link
              href="/contractor/reviews"
              className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:border-slate-300 shadow-sm transition-colors"
            >
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              My Reviews
            </Link>
          </div>
        </div>
        <div className="text-right text-sm">
          <p className="text-slate-400">Service postcodes</p>
          <p className="font-semibold text-slate-700 text-xs mt-0.5">
            {profile.service_postcodes?.join(', ') ?? '—'}
          </p>
        </div>
      </div>

      {/* Active jobs */}
      <section>
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">
          Active Jobs
          {active.length > 0 && (
            <span className="ml-2 text-xs font-semibold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full normal-case tracking-normal">
              {active.length}
            </span>
          )}
        </h2>

        {active.length === 0 ? (
          <div className="flex flex-col items-center py-12 gap-3 bg-white rounded-2xl border border-slate-200 text-center">
            <ClipboardList className="w-8 h-8 text-slate-300" />
            <p className="text-sm text-slate-500">No active jobs right now. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {active.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>

      {/* Completed jobs */}
      {completed.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">
            Completed
          </h2>
          <div className="space-y-3">
            {completed.map((job) => (
              <JobCard key={job.id} job={job} compact />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function JobCard({ job, compact = false }: { job: JobWithJoins; compact?: boolean }) {
  const tier = job.services?.tier ?? 'Silver';
  const pricing = calculatePrice(job.bedrooms_count, job.bathrooms_count, tier);
  const status = STATUS_CONFIG[job.status];
  const tierColor = TIER_BADGE_COLORS[tier];
  const isCheckedIn = !!job.checked_in_at;

  return (
    <Link
      href={`/contractor/jobs/${job.id}`}
      className="block bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-teal-300 hover:shadow-md transition group"
    >
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full border', tierColor)}>
            {tier}
          </span>
          <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full border', status.classes)}>
            {status.label}
          </span>
          {isCheckedIn && (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              Checked In ✓
            </span>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-teal-500 transition" />
      </div>

      <div className={cn('px-4 pb-4', compact ? 'pt-3 space-y-1.5' : 'pt-4 space-y-3')}>
        <div className="flex items-start gap-2 text-sm">
          <CalendarDays className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-slate-800">{formatDate(job.scheduled_datetime)}</p>
            <p className="text-slate-400 text-xs">{formatTime(job.scheduled_datetime)}</p>
          </div>
        </div>

        <div className="flex items-start gap-2 text-sm text-slate-600">
          <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <span>
            {job.address}, <strong>{job.suburb}</strong> {job.postcode}
          </span>
        </div>

        {!compact && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-slate-500">
              <Package className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{job.bedrooms_count} bed · {job.bathrooms_count} bath</span>
            </div>
            <div className="text-right">
              <p className="font-extrabold text-teal-700 text-base">{pricing.formattedContractorPayout} AUD</p>
              <p className="text-xs text-slate-400">your earnings (80%)</p>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
