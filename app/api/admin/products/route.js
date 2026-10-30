import { NextResponse } from 'next/server';
import { isAdminAuthed } from '@/lib/adminAuth';
import {
  createProductRow,
  updateProductRow,
  deleteProductRow,
} from '@/lib/supabase';

// /api/admin/products — product CRUD for /admin/products.
//   POST   { ...fields }        → create (id generated server-side)
//   PATCH  { id, ...fields }    → update
//   DELETE ?id=<id>             → delete
// Admin session required for all three.

function cleanText(value, max) {
  const s = String(value || '').trim();
  return s.length <= max ? s : null;
}

function cleanName(value) {
  const s = cleanText(value, 120);
  return s && s.length >= 3 ? s : null;
}

function cleanMoney(value, allowZero) {
  const n = Number(value);
  if (!Number.isInteger(n) || n > 10000000) return null;
  if (allowZero ? n < 0 : n <= 0) return null;
  return n;
}

function cleanFields(body) {
  const fields = {
    name: cleanName(body.name),
    subtitle: cleanText(body.subtitle, 200),
    price: cleanMoney(body.price, false),
    regular_price: cleanMoney(body.regularPrice, true),
    image: cleanText(body.image, 500),
    active: body.active !== false,
    sort: Number.isInteger(Number(body.sort)) ? Number(body.sort) : null,
  };
  if (
    fields.name === null ||
    fields.subtitle === null ||
    fields.price === null ||
    fields.regular_price === null ||
    fields.image === null ||
    fields.sort === null
  ) {
    return null;
  }
  return fields;
}

async function readBody(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function fail(error, status) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(request) {
  if (!(await isAdminAuthed())) return fail('লগইন করা নেই।', 401);
  const body = await readBody(request);
  if (!body) return fail('ভুল ডেটা পাঠানো হয়েছে।', 400);
  const fields = cleanFields(body);
  if (!fields) return fail('সব ঘরে সঠিক তথ্য দিন।', 400);

  const id = `p-${Date.now().toString(36)}`;
  const result = await createProductRow({ id, ...fields });
  if (!result.ok) return fail(result.error || 'প্রোডাক্ট তৈরি করা যায়নি।', 502);
  return NextResponse.json({ ok: true, id });
}

export async function PATCH(request) {
  if (!(await isAdminAuthed())) return fail('লগইন করা নেই।', 401);
  const body = await readBody(request);
  if (!body) return fail('ভুল ডেটা পাঠানো হয়েছে।', 400);
  const id = String(body.id || '');
  const fields = cleanFields(body);
  if (!id || !fields) return fail('সব ঘরে সঠিক তথ্য দিন।', 400);

  const result = await updateProductRow(id, fields);
  if (!result.ok) return fail(result.error || 'সেভ করা যায়নি।', 502);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request) {
  if (!(await isAdminAuthed())) return fail('লগইন করা নেই।', 401);
  const id = new URL(request.url).searchParams.get('id') || '';
  if (!id) return fail('প্রোডাক্ট আইডি পাওয়া যায়নি।', 400);

  const result = await deleteProductRow(id);
  if (!result.ok) return fail(result.error || 'মুছা যায়নি।', 502);
  return NextResponse.json({ ok: true });
}
