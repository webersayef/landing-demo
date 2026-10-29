import { NextResponse } from 'next/server';
import { isAdminAuthed } from '@/lib/adminAuth';
import { updateOrderStatus } from '@/lib/supabase';

const VALID_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

// PATCH /api/admin/orders — { id, status } → updates an order's status.
// Admin session required.
export async function PATCH(request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json(
      { ok: false, error: 'লগইন করা নেই।' },
      { status: 401 }
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

  const id = String(body.id || '');
  const status = String(body.status || '');
  if (!id || !VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { ok: false, error: 'সঠিক অর্ডার আইডি ও স্ট্যাটাস দিন।' },
      { status: 400 }
    );
  }

  const result = await updateOrderStatus(id, status);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error || 'আপডেট করা যায়নি।' },
      { status: 502 }
    );
  }
  return NextResponse.json({ ok: true });
}
