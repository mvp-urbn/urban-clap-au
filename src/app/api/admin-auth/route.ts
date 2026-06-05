import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { pin } = await request.json();

  if (pin !== process.env.ADMIN_PIN) {
    return NextResponse.json({ error: 'Wrong PIN' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set('admin_pin', process.env.ADMIN_PIN!, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8, // 8 hours
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set('admin_pin', '', { maxAge: 0, path: '/' });
  return response;
}
