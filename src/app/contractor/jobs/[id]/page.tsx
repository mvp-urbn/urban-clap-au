import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { ArrowLeft, CalendarDays } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getContractorProfile, getContractorJob } from '@/app/actions/contractor';
import { JobDetail } from './JobDetail';
import { TIER_BADGE_COLORS } from '@/types';
import type { ServiceTier } from '@/types';
import { cn } from '@/lib/utils';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-AU', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
}

export default async function ContractorJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login?next=/contractor/jobs');

  const profile = await getContractorProfile();
  if (!profile || profile.role !== 'contractor') redirect('/contractor/onboard');
  if (profile.contractor_status !== 'approved') redirect('/contractor');

  const job = await getContractorJob(id);
  if (!job) notFound();

  const tier = (job.services as { tier: ServiceTier } | null)?.tier ?? 'Silver';
  const tierColor = TIER_BADGE_COLORS[tier];

  return (
    <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
      {/* Back nav */}
      <Link
        href="/contractor/jobs"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition font-semibold"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to My Jobs
      </Link>

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full border', tierColor)}>
            {tier}
          </span>
          <span className="text-xs text-slate-400 font-mono">#{id.slice(0, 8).toUpperCase()}</span>
        </div>
        <h1 className="text-xl font-extrabold text-slate-900">{job.suburb} Clean</h1>
        <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
          <CalendarDays className="w-4 h-4" />
          <span>{formatDate(job.scheduled_datetime)} · {formatTime(job.scheduled_datetime)}</span>
        </div>
      </div>

      {/* Main detail component (client) */}
      <JobDetail job={job as Parameters<typeof JobDetail>[0]['job']} />
    </main>
  );
}
