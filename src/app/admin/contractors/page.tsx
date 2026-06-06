import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getAllContractors } from '@/app/actions/contractor';
import { ContractorsPanel } from './ContractorsPanel';

export const dynamic = 'force-dynamic';

export default async function ContractorsPage() {
  const cookieStore = await cookies();
  const adminPin = cookieStore.get('admin_pin')?.value;

  if (adminPin !== process.env.ADMIN_PIN) {
    redirect('/admin/login');
  }

  const contractors = await getAllContractors();

  return <ContractorsPanel initialContractors={contractors} />;
}
