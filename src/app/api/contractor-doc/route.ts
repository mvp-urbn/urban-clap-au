import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';

// Admin-only route — checks the admin session cookie, then creates a 60-min signed URL
export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get('admin_session')?.value;
  if (adminSession !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const path = req.nextUrl.searchParams.get('path');
  if (!path) return NextResponse.json({ error: 'Missing path' }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from('contractor-docs')
    .createSignedUrl(path, 3600); // 1-hour signed URL

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: 'Could not generate URL' }, { status: 500 });
  }

  return NextResponse.redirect(data.signedUrl);
}
