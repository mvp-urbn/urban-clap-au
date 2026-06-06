import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getContractorProfile, getContractorDashboardData, getOrCreateReferralCode } from '@/app/actions/contractor';
import { ContractorDashboard } from './ContractorDashboard';

export default async function ContractorDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/contractor/login');

  const profile = await getContractorProfile();

  if (!profile || profile.role !== 'contractor') redirect('/contractor/onboard');
  if (profile.contractor_status !== 'approved') redirect('/contractor');

  const [dashData, referralCode] = await Promise.all([
    getContractorDashboardData(),
    getOrCreateReferralCode(),
  ]);

  return (
    <ContractorDashboard
      profile={dashData.profile}
      newJobs={dashData.newJobs}
      history={dashData.history}
      totalEarningsCents={dashData.totalEarningsCents}
      avgRating={dashData.avgRating}
      email={dashData.email}
      referralCode={referralCode}
    />
  );
}
