import { NextResponse } from 'next/server';
import { isAdminAuthed } from '@/lib/adminAuth';
import { isSupabaseConfigured, uploadImage } from '@/lib/supabase';

// POST /api/admin/upload (Phase 5) — multipart form field "file".
// Uploads one image to the public Supabase Storage bucket
// "images" and returns its public URL as { ok, url }.
// Admin session required. Max 4 MB; jpg/png/webp/gif only.

const MAX_BYTES = 4 * 1024 * 1024;
const TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

function fail(error, status) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(request) {
  if (!(await isAdminAuthed())) return fail('লগইন করা নেই।', 401);
  if (!isSupabaseConfigured()) {
    return fail(
      'ডাটাবেস সেটআপ হয়নি — ছবি আপলোড করতে আগে Vercel-এ SUPABASE_URL ও SUPABASE_SERVICE_ROLE_KEY সেট করুন।',
      501
    );
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return fail('ভুল ডেটা পাঠানো হয়েছে।', 400);
  }
  const file = form.get('file');
  if (!file || typeof file.arrayBuffer !== 'function') {
    return fail('কোনো ফাইল পাওয়া যায়নি।', 400);
  }
  const ext = TYPES[file.type];
  if (!ext) {
    return fail('শুধু JPG, PNG, WebP বা GIF ছবি আপলোড করা যাবে।', 400);
  }
  if (file.size > MAX_BYTES) {
    return fail('ছবিটি বড় — সর্বোচ্চ ৪ MB-এর ছবি আপলোড করা যাবে। ছবিটি ছোট করে আবার চেষ্টা করুন।', 400);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await uploadImage(buffer, file.type, ext);
  if (!result.ok) {
    return fail(
      result.error || 'আপলোড করা যায়নি। "images" নামের Storage bucket আছে কিনা দেখুন (supabase-phase5.sql চালানো হয়েছে তো?)।',
      502
    );
  }
  return NextResponse.json({ ok: true, url: result.url });
}
