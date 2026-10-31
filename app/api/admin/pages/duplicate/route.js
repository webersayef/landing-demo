import { NextResponse } from 'next/server';
import { isAdminAuthed } from '@/lib/adminAuth';
import { duplicatePage } from '@/lib/supabase';

// POST /api/admin/pages/duplicate — { id } → copies the page and
// its product links under a fresh slug ("<slug>-copy", …).
export async function POST(request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ ok: false, error: 'লগইন করা নেই।' }, { status: 401 });
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
  if (!id) {
    return NextResponse.json(
      { ok: false, error: 'পেজের আইডি পাওয়া যায়নি।' },
      { status: 400 }
    );
  }
  const result = await duplicatePage(id);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error || 'কপি করা যায়নি।' },
      { status: 502 }
    );
  }
  return NextResponse.json({ ok: true, id: result.data.id, slug: result.data.slug });
}
