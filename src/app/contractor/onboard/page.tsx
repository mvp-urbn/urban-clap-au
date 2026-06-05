import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getContractorProfile } from '@/app/actions/contractor';
import { OnboardForm } from './OnboardForm';

export default async function ContractorOnboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login?next=/contractor/onboard');

  const profile = await getContractorProfile();

  // Already approved — skip onboarding
  if (profile?.role === 'contractor' && profile.contractor_status === 'approved') {
    redirect('/contractor/jobs');
  }

  const defaultName =
    (user.user_metadata?.full_name as string | undefined) ??
    profile?.full_name ??
    '';

  return (
    <main className="max-w-lg mx-auto px-4 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Become a Contractor</h1>
        <p className="text-slate-500 text-sm mt-1 leading-relaxed">
          Fill in your details below. Once approved, you&apos;ll get access to the job board and can start earning.
        </p>
      </div>

      <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 text-sm text-teal-800 space-y-1">
        <p className="font-semibold">Requirements</p>
        <ul className="list-disc list-inside space-y-0.5 text-teal-700">
          <li>Valid ABN registered with the ATO</li>
          <li>Current public liability insurance (min. $5M)</li>
          <li>Police check (we&apos;ll request this after approval)</li>
        </ul>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <OnboardForm defaultName={defaultName} />
      </div>
    </main>
  );
}
