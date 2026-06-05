import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getContractorProfile } from '@/app/actions/contractor';

export default async function ContractorRootPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login?next=/contractor');

  const profile = await getContractorProfile();

  if (!profile || profile.role !== 'contractor') {
    redirect('/contractor/onboard');
  }

  if (profile.contractor_status === 'approved') {
    redirect('/contractor/jobs');
  }

  // Pending or suspended — show status page
  const isSuspended = profile.contractor_status === 'suspended';

  return (
    <main className="max-w-lg mx-auto px-4 py-16 text-center space-y-6">
      <div
        className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto text-3xl ${
          isSuspended ? 'bg-red-100' : 'bg-amber-100'
        }`}
      >
        {isSuspended ? '🚫' : '⏳'}
      </div>
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">
          {isSuspended ? 'Account Suspended' : 'Application Under Review'}
        </h1>
        <p className="text-slate-500 text-sm mt-2 leading-relaxed">
          {isSuspended
            ? 'Your contractor account has been suspended. Please contact us for more information.'
            : "We've received your application and are reviewing your ABN and insurance details. You'll receive an email once you're approved — usually within 1 business day."}
        </p>
      </div>
      {!isSuspended && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left text-sm space-y-2">
          <p className="font-semibold text-slate-700">What happens next?</p>
          <ul className="text-slate-500 space-y-1 list-disc list-inside">
            <li>We verify your ABN with the Australian Business Register</li>
            <li>We check your insurance is current and adequate</li>
            <li>We send you an approval email with your first job board access</li>
          </ul>
        </div>
      )}
    </main>
  );
}
