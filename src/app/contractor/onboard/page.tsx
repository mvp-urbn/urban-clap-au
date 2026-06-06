import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getContractorProfile } from '@/app/actions/contractor';
import { OnboardForm } from './OnboardForm';

export default async function ContractorOnboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/contractor/login');

  const profile = await getContractorProfile();

  // Already approved — skip onboarding
  if (profile?.role === 'contractor' && profile.contractor_status === 'approved') {
    redirect('/contractor/dashboard');
  }

  const defaultName =
    (user.user_metadata?.full_name as string | undefined) ??
    profile?.full_name ??
    '';
  const defaultPhone =
    (user.user_metadata?.phone_number as string | undefined) ??
    profile?.phone_number ??
    '';

  return (
    <main className="max-w-lg mx-auto px-4 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Complete Your Profile</h1>
        <p className="text-slate-500 text-sm mt-1 leading-relaxed">
          A few more details before you can start taking jobs. Once submitted, we&apos;ll review your application within 1 business day.
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
        <OnboardForm defaultName={defaultName} defaultPhone={defaultPhone} />
      </div>
    </main>
  );
}
