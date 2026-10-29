import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, getSessionToken } from '@/lib/adminAuth';

// POST /api/admin/login — { password } → sets the admin session cookie.
export async function POST(request) {
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { ok: false, error: 'অ্যাডমিন পাসওয়ার্ড সেট করা হয়নি' },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'ভুল ডেটা পাঠানো হয়েছে।' },
      { status: 400 }
    );
  }

  if (String(body.password || '') !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { ok: false, error: 'ভুল পাসওয়ার্ড' },
      { status: 401 }
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, getSessionToken(), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return res;
}
