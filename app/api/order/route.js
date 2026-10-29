import { NextResponse } from 'next/server';
import {
  getProduct,
  getDeliveryArea,
  isValidBdPhone,
} from '@/lib/products';

// POST /api/order — validates the order, recomputes totals server-side
// from the shared price table, and returns the confirmed order object.
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
  const product = getProduct(body.productId);
  const area = getDeliveryArea(body.areaId);
  const quantity = Number(body.quantity);

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
  if (!product) {
    return NextResponse.json(
      { ok: false, error: 'প্রোডাক্ট সিলেকশন সঠিক নয়।' },
      { status: 400 }
    );
  }
  if (!area) {
    return NextResponse.json(
      { ok: false, error: 'ডেলিভারি এলাকা সিলেক্ট করুন।' },
      { status: 400 }
    );
  }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
    return NextResponse.json(
      { ok: false, error: 'পরিমাণ ১ থেকে ১০-এর মধ্যে হতে হবে।' },
      { status: 400 }
    );
  }

  // Totals are ALWAYS computed here from the price table — never trusted
  // from the client.
  const subtotal = product.price * quantity;
  const deliveryCharge = area.charge;
  const total = subtotal + deliveryCharge;

  const order = {
    id: `ORD-${Date.now()}`,
    createdAt: new Date().toISOString(),
    name,
    phone,
    address,
    productId: product.id,
    productName: product.name,
    unitPrice: product.price,
    quantity,
    subtotal,
    areaId: area.id,
    areaLabel: area.label,
    deliveryCharge,
    total,
    status: 'pending',
  };

  // ────────────────────────────────────────────────────────────────
  // TODO (later phase): save the order to Supabase.
  // The user deferred order storage/viewing, so for now the order is
  // only logged. When ready, insert here, e.g.:
  //
  //   import { createClient } from ... // supabase client
  //   await supabase.from('orders').insert(order);
  //
  // and build the /admin panel on top of that table.
  // ────────────────────────────────────────────────────────────────
  console.log('[NEW ORDER]', JSON.stringify(order));

  return NextResponse.json({ ok: true, order });
}
