import { NextResponse } from 'next/server';
import { isAdminAuthed } from '@/lib/adminAuth';
import {
  createPageRow,
  updatePageRow,
  deletePageRow,
  getPageById,
  getPageBySlug,
  setPageProducts,
} from '@/lib/supabase';

// /api/admin/pages — landing page CRUD for /admin/pages (Phase 5).
//   POST   { ...fields, productSet }      → create
//   PATCH  { id, ...fields, productSet }  → update (incl. products)
//   DELETE ?id=<id>                       → delete
// Admin session required for all three. productSet is
// [{ product_id, sort }] — the page's products in display order.

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function cleanText(value, max) {
  const s = String(value ?? '').trim();
  return s.length <= max ? s : null;
}

function cleanCharge(value) {
  // Blank → null (page falls back to the general delivery charge).
  if (value === null || value === undefined || value === '') {
    return { ok: true, value: null };
  }
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0 || n > 100000) return { ok: false };
  return { ok: true, value: n };
}

function cleanFields(body) {
  const inside = cleanCharge(body.deliveryInside);
  const outside = cleanCharge(body.deliveryOutside);
  const fields = {
    name: cleanText(body.name, 120),
    slug: cleanText(body.slug, 80),
    headline: cleanText(body.headline, 300),
    description: cleanText(body.description, 1000),
    selection_mode: body.selectionMode === 'multi' ? 'multi' : 'single',
    delivery_inside: inside.ok ? inside.value : undefined,
    delivery_outside: outside.ok ? outside.value : undefined,
    pixel_id: cleanText(body.pixelId, 64) || null,
    active: body.active !== false,
  };
  if (
    fields.name === null ||
    fields.name.length < 2 ||
    fields.slug === null ||
    !SLUG_RE.test(fields.slug) ||
    fields.headline === null ||
    fields.description === null ||
    !inside.ok ||
    !outside.ok
  ) {
    return null;
  }
  return fields;
}

function cleanProductSet(value) {
  if (value === undefined) return null; // not provided → leave untouched
  if (!Array.isArray(value)) return false;
  const rows = [];
  for (const item of value) {
    const productId = String((item && item.product_id) || '').trim();
    if (!productId) return false;
    const sort = Number(item.sort);
    rows.push({
      product_id: productId,
      sort: Number.isInteger(sort) ? sort : 0,
    });
  }
  return rows;
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

const SLUG_TAKEN = 'এই স্লাগটি ইতিমধ্যে অন্য একটি পেজে ব্যবহার হচ্ছে — অন্য স্লাগ দিন।';

export async function POST(request) {
  if (!(await isAdminAuthed())) return fail('লগইন করা নেই।', 401);
  const body = await readBody(request);
  if (!body) return fail('ভুল ডেটা পাঠানো হয়েছে।', 400);
  const fields = cleanFields(body);
  if (!fields) return fail('সব ঘরে সঠিক তথ্য দিন (স্লাগে শুধু ছোট হাতের ইংরেজি অক্ষর, সংখ্যা ও হাইফেন চলবে)।', 400);
  const productSet = cleanProductSet(body.productSet);
  if (productSet === false) return fail('প্রোডাক্ট তালিকা সঠিক নয়।', 400);

  const existing = await getPageBySlug(fields.slug);
  if (existing.data) return fail(SLUG_TAKEN, 400);

  const id = `lp-${Date.now().toString(36)}`;
  const result = await createPageRow({ id, ...fields });
  if (!result.ok) return fail(result.error || 'পেজ তৈরি করা যায়নি।', 502);

  if (productSet) {
    const saved = await setPageProducts(id, productSet);
    if (!saved.ok) return fail(saved.error || 'প্রোডাক্ট সেভ করা যায়নি।', 502);
  }
  return NextResponse.json({ ok: true, id });
}

export async function PATCH(request) {
  if (!(await isAdminAuthed())) return fail('লগইন করা নেই।', 401);
  const body = await readBody(request);
  if (!body) return fail('ভুল ডেটা পাঠানো হয়েছে।', 400);
  const id = String(body.id || '');
  const fields = cleanFields(body);
  if (!id || !fields) return fail('সব ঘরে সঠিক তথ্য দিন (স্লাগে শুধু ছোট হাতের ইংরেজি অক্ষর, সংখ্যা ও হাইফেন চলবে)।', 400);
  const productSet = cleanProductSet(body.productSet);
  if (productSet === false) return fail('প্রোডাক্ট তালিকা সঠিক নয়।', 400);

  const current = await getPageById(id);
  if (!current.data) return fail('পেজটি পাওয়া যায়নি।', 404);
  if (current.data.slug !== fields.slug) {
    const clash = await getPageBySlug(fields.slug);
    if (clash.data) return fail(SLUG_TAKEN, 400);
  }

  const result = await updatePageRow(id, fields);
  if (!result.ok) return fail(result.error || 'সেভ করা যায়নি।', 502);

  if (productSet) {
    const saved = await setPageProducts(id, productSet);
    if (!saved.ok) return fail(saved.error || 'প্রোডাক্ট সেভ করা যায়নি।', 502);
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request) {
  if (!(await isAdminAuthed())) return fail('লগইন করা নেই।', 401);
  const id = new URL(request.url).searchParams.get('id') || '';
  if (!id) return fail('পেজের আইডি পাওয়া যায়নি।', 400);

  const result = await deletePageRow(id);
  if (!result.ok) return fail(result.error || 'মুছা যায়নি।', 502);
  return NextResponse.json({ ok: true });
}
