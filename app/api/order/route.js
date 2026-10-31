import { NextResponse } from 'next/server';
import { isValidBdPhone } from '@/lib/products';
import {
  getCatalog,
  getPageCatalog,
  findProduct,
  findArea,
} from '@/lib/catalog';
import { isSupabaseConfigured, insertOrder } from '@/lib/supabase';

// POST /api/order — validates the order, recomputes totals server-side
// from the shared price table, and returns the confirmed order object.
//
// Two request shapes are accepted:
//   legacy: { productId, quantity }                    (single product)
//   lines:  { items: [{ productId, quantity }, ...] }  (multi mode)
// When `pageSlug` is present, the order is resolved against that
// landing page instead of the homepage catalog: only the page's own
// products may be ordered, its selection_mode is enforced (single =
// exactly one line) and its delivery charges apply.
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'ভুল ডেটা পাঠানো হয়েছে।' },
      { status: 400 }
    );
  }

  const name = String(body.name || '').trim();
  const phone = String(body.phone || '').trim();
  const address = String(body.address || '').trim();
  const pageSlug = body.pageSlug ? String(body.pageSlug).trim() : '';

  if (name.length < 3) {
    return NextResponse.json(
      { ok: false, error: 'সঠিক নাম দিন।' },
      { status: 400 }
    );
  }
  if (!isValidBdPhone(phone)) {
    return NextResponse.json(
      { ok: false, error: 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (01 দিয়ে শুরু)।' },
      { status: 400 }
    );
  }
  if (address.length < 10) {
    return NextResponse.json(
      { ok: false, error: 'সম্পূর্ণ ঠিকানা দিন।' },
      { status: 400 }
    );
  }

  // Prices are read from the database (admin-editable) with static
  // fallbacks — totals below are computed from THIS data only.
  // Landing-page orders use the page's own catalog.
  let catalog;
  let page = null;
  if (pageSlug) {
    const pageCatalog = await getPageCatalog(pageSlug);
    if (!pageCatalog) {
      return NextResponse.json(
        { ok: false, error: 'ল্যান্ডিং পেজটি পাওয়া যায়নি।' },
        { status: 400 }
      );
    }
    catalog = pageCatalog;
    page = pageCatalog.page;
  } else {
    catalog = await getCatalog();
  }

  // Normalise the request into order lines.
  const rawLines =
    Array.isArray(body.items) && body.items.length
      ? body.items.map((it) => ({
          productId: it && it.productId,
          quantity: Number(it && it.quantity),
        }))
      : [{ productId: body.productId, quantity: Number(body.quantity) }];

  if (page && page.selectionMode === 'single' && rawLines.length !== 1) {
    return NextResponse.json(
      { ok: false, error: 'এই পেজে একবারে একটি প্রোডাক্টই অর্ডার করা যাবে।' },
      { status: 400 }
    );
  }

  const lines = [];
  for (const raw of rawLines) {
    const lineProduct = findProduct(catalog, raw.productId);
    if (!lineProduct) {
      return NextResponse.json(
        { ok: false, error: 'প্রোডাক্ট সিলেকশন সঠিক নয়।' },
        { status: 400 }
      );
    }
    if (
      !Number.isInteger(raw.quantity) ||
      raw.quantity < 1 ||
      raw.quantity > 10
    ) {
      return NextResponse.json(
        { ok: false, error: 'পরিমাণ ১ থেকে ১০-এর মধ্যে হতে হবে।' },
        { status: 400 }
      );
    }
    lines.push({ product: lineProduct, quantity: raw.quantity });
  }

  const area = findArea(catalog, body.areaId);
  if (!area) {
    return NextResponse.json(
      { ok: false, error: 'ডেলিভারি এলাকা সিলেক্ট করুন।' },
      { status: 400 }
    );
  }

  // Totals are ALWAYS computed here from the price table — never trusted
  // from the client.
  const subtotal = lines.reduce(
    (sum, l) => sum + l.product.price * l.quantity,
    0
  );
  const deliveryCharge = area.charge;
  const total = subtotal + deliveryCharge;

  const first = lines[0];
  const items = lines.map((l) => ({
    product_id: l.product.id,
    name: l.product.name,
    price: l.product.price,
    quantity: l.quantity,
  }));

  const order = {
    id: `ORD-${Date.now()}`,
    createdAt: new Date().toISOString(),
    name,
    phone,
    address,
    // Legacy single-product fields mirror the first line, so the
    // thank-you page and older admin views keep working unchanged.
    productId: first.product.id,
    productName:
      lines.length > 1
        ? `${first.product.name} (আরও ${lines.length - 1}টি প্রোডাক্ট)`
        : first.product.name,
    unitPrice: first.product.price,
    quantity: first.quantity,
    items,
    pageSlug: pageSlug || null,
    subtotal,
    areaId: area.id,
    areaLabel: area.label,
    deliveryCharge,
    total,
    status: 'pending',
  };

  // Always log the order (visible in server/Vercel logs).
  console.log('[NEW ORDER]', JSON.stringify(order));

  // Persist to Supabase when configured (see lib/supabase.js). A
  // database failure must NEVER fail the customer's order — the order
  // is already confirmed above, so we only log the outcome here.
  if (isSupabaseConfigured()) {
    const saved = await insertOrder(order);
    if (saved.ok) {
      console.log('[ORDER SAVED]', order.id);
    } else {
      console.error('[ORDER SAVE FAILED]', order.id, saved.error);
    }
  }

  return NextResponse.json({ ok: true, order });
}
