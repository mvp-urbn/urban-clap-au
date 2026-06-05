import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getAllBookings, getAdminStats } from '@/app/actions/bookings';
import { AdminDashboard } from './AdminDashboard';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const cookieStore = await cookies();
  const adminPin = cookieStore.get('admin_pin')?.value;

  if (adminPin !== process.env.ADMIN_PIN) {
    redirect('/admin/login');
  }

  const [bookings, stats] = await Promise.all([getAllBookings(), getAdminStats()]);

  return <AdminDashboard initialBookings={bookings} stats={stats} />;
}
