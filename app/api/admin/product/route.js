import { NextResponse } from 'next/server';
import { isAdminAuthed } from '@/lib/adminAuth';
import { saveSiteSettings } from '@/lib/supabase';

// PATCH /api/admin/product — saves product names, prices and
// delivery charges to the site_settings row (see
// supabase-products.sql). Admin session required. Values are
// validated here; the storefront reads them back via lib/catalog.js.

function cleanName(value) {
  const s = String(value || '').trim();
  return s.length >= 3 && s.length <= 120 ? s : null;
}

function cleanMoney(value, allowZero) {
  const n = Number(value);
  if (!Number.isInteger(n) || n > 10000000) return null;
  if (allowZero ? n < 0 : n <= 0) return null;
  return n;
}

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

  const fields = {
    basic_name: cleanName(body.basicName),
    basic_price: cleanMoney(body.basicPrice, false),
    basic_regular_price: cleanMoney(body.basicRegularPrice, true),
    pro_name: cleanName(body.proName),
    pro_price: cleanMoney(body.proPrice, false),
    pro_regular_price: cleanMoney(body.proRegularPrice, true),
    delivery_inside: cleanMoney(body.deliveryInside, true),
    delivery_outside: cleanMoney(body.deliveryOutside, true),
  };

  if (Object.values(fields).some((v) => v === null)) {
    return NextResponse.json(
      { ok: false, error: 'সব ঘরে সঠিক নাম ও টাকার পরিমাণ দিন।' },
      { status: 400 }
    );
  }

  const result = await saveSiteSettings(fields);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error || 'সেভ করা যায়নি।' },
      { status: 502 }
    );
  }
  return NextResponse.json({ ok: true });
}
