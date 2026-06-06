import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getAllReviews } from '@/app/actions/bookings';
import { ReviewsPanel } from './ReviewsPanel';

export const dynamic = 'force-dynamic';

export default async function ReviewsPage() {
  const cookieStore = await cookies();
  const adminPin = cookieStore.get('admin_pin')?.value;
  if (adminPin !== process.env.ADMIN_PIN) redirect('/admin/login');

  const reviews = await getAllReviews();
  return <ReviewsPanel initialReviews={reviews} />;
}
