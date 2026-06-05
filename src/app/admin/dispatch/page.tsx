import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getActiveBookings } from '@/app/actions/bookings';
import { DispatchDashboard } from './DispatchDashboard';

export const dynamic = 'force-dynamic';

export default async function DispatchPage() {
  const cookieStore = await cookies();
  const adminPin = cookieStore.get('admin_pin')?.value;

  if (adminPin !== process.env.ADMIN_PIN) {
    redirect('/admin/login');
  }

  const bookings = await getActiveBookings();

  return <DispatchDashboard initialBookings={bookings ?? []} />;
}
