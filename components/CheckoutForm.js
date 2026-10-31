'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatBDT, isValidBdPhone } from '@/lib/products';

// Embedded checkout form: the landing page is a single page —
// this form renders at the bottom of the page inside the
// #checkout section, and the "অর্ডার করুন" buttons scroll to it.
// Product/price data arrives as props from the server page,
// which reads it from the database (lib/catalog.js).
//
// Phase 5 props:
//   selectionMode  'single' (radio + one quantity — the original
//                  behaviour) or 'multi' (checkboxes, each
//                  selected product with its own quantity)
//   pageSlug       set on /lp/[slug] pages so the order knows
//                  which landing page it came from
//   pixelId        the page's active Meta pixel id; stored in
//                  sessionStorage before redirecting so the
//                  thank-you page can fire Purchase on it
export default function CheckoutForm({
  products,
  areas,
  selectionMode = 'single',
  pageSlug = '',
  pixelId = '',
}) {
  const router = useRouter();
  const multi = selectionMode === 'multi';

  // Single-mode state (original behaviour).
  const [productId, setProductId] = useState(products[0].id);
  const [quantity, setQuantity] = useState(1);

  // Multi-mode state: { [productId]: quantity } for ticked items.
  const [selection, setSelection] = useState(() =>
    products[0] ? { [products[0].id]: 1 } : {}
  );

  const [areaId, setAreaId] = useState(areas[0].id);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [formError, setFormError] = useState('');
  const [sending, setSending] = useState(false);

  const product = useMemo(
    () => products.find((p) => p.id === productId),
    [products, productId]
  );
  const area = useMemo(
    () => areas.find((a) => a.id === areaId),
    [areas, areaId]
  );

  const lines = useMemo(() => {
    if (!multi) return [{ product, quantity }];
    return products
      .filter((p) => selection[p.id])
      .map((p) => ({ product: p, quantity: selection[p.id] }));
  }, [multi, products, selection, product, quantity]);

  const subtotal = lines.reduce(
    (sum, l) => sum + l.product.price * l.quantity,
    0
  );
  const total = subtotal + area.charge;

  function toggleSelected(p, checked) {
    setSelection((prev) => {
      const next = { ...prev };
      if (checked) next[p.id] = next[p.id] || 1;
      else delete next[p.id];
      return next;
    });
    setFormError('');
  }

  function setLineQty(id, qty) {
    setSelection((prev) => ({
      ...prev,
      [id]: Math.min(10, Math.max(1, qty)),
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    setPhoneError('');

    if (name.trim().length < 3) {
      setFormError('অনুগ্রহ করে আপনার সঠিক নাম লিখুন।');
      return;
    }
    if (!isValidBdPhone(phone)) {
      setPhoneError('সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (01 দিয়ে শুরু)।');
      return;
    }
    if (address.trim().length < 10) {
      setFormError('অনুগ্রহ করে সম্পূর্ণ ঠিকানা লিখুন, যাতে ডেলিভারি সহজ হয়।');
      return;
    }
    if (multi && lines.length === 0) {
      setFormError('অন্তত একটি প্রোডাক্ট সিলেক্ট করুন।');
      return;
    }

    setSending(true);
    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        areaId,
      };
      if (pageSlug) payload.pageSlug = pageSlug;
      if (multi) {
        payload.items = lines.map((l) => ({
          productId: l.product.id,
          quantity: l.quantity,
        }));
      } else {
        payload.productId = productId;
        payload.quantity = quantity;
      }
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'order failed');
      }
      sessionStorage.setItem('lastOrder', JSON.stringify(data.order));
      // The thank-you page fires Purchase on this pixel (the env
      // pixel is already covered by its own tracker there).
      if (pixelId) {
        try {
          sessionStorage.setItem('fb_pixel_id', pixelId);
        } catch {
          // storage unavailable — Purchase falls back silently
        }
      }
      router.push('/thank-you');
    } catch {
      setFormError(
        'দুঃখিত, অর্ডারটি সম্পন্ন করা যায়নি। আবার চেষ্টা করুন অথবা কল করুন 01741-783703 নম্বরে।'
      );
      setSending(false);
    }
  }

  const areaStep = multi ? '২' : '৩';
  const infoStep = multi ? '৩' : '৪';

  return (
    <div className="checkout-wrap">
        <h1>অর্ডার ফর্ম</h1>
        <p>ক্যাশ অন ডেলিভারি — ফর্মটি পূরণ করুন, আমরাই কল করে কনফার্ম করব।</p>

        <form onSubmit={handleSubmit} noValidate>
          {/* Product selection */}
          <h2 className="section-label">১. প্রোডাক্ট সিলেক্ট করুন</h2>
          {!multi &&
            products.map((p) => (
              <label
                key={p.id}
                className={p.id === productId ? 'option-card selected' : 'option-card'}
              >
                <input
                  type="radio"
                  name="product"
                  value={p.id}
                  checked={p.id === productId}
                  onChange={() => setProductId(p.id)}
                />
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt="" className="option-thumb" />
                ) : null}
                <span className="option-info">
                  <strong>{p.name}</strong>
                  <small>{p.subtitle || 'SoundPro X9 ওয়্যারলেস হেডফোন'}</small>
                </span>
                <span className="option-price">
                  {formatBDT(p.price)}
                  <s>{formatBDT(p.regularPrice)}</s>
                </span>
              </label>
            ))}

          {multi &&
            products.map((p) => {
              const qty = selection[p.id];
              const checked = Boolean(qty);
              return (
                <div key={p.id}>
                  <label
                    className={checked ? 'option-card selected' : 'option-card'}
                  >
                    <input
                      type="checkbox"
                      value={p.id}
                      checked={checked}
                      onChange={(e) => toggleSelected(p, e.target.checked)}
                    />
                    {p.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image} alt="" className="option-thumb" />
                    ) : null}
                    <span className="option-info">
                      <strong>{p.name}</strong>
                      <small>{p.subtitle || 'SoundPro X9 ওয়্যারলেস হেডফোন'}</small>
                    </span>
                    <span className="option-price">
                      {formatBDT(p.price)}
                      <s>{formatBDT(p.regularPrice)}</s>
                    </span>
                  </label>
                  {checked ? (
                    <div className="qty-row line-qty">
                      <button
                        type="button"
                        className="qty-btn"
                        aria-label="পরিমাণ কমান"
                        disabled={qty <= 1}
                        onClick={() => setLineQty(p.id, qty - 1)}
                      >
                        −
                      </button>
                      <span className="qty-value">{qty}</span>
                      <button
                        type="button"
                        className="qty-btn"
                        aria-label="পরিমাণ বাড়ান"
                        disabled={qty >= 10}
                        onClick={() => setLineQty(p.id, qty + 1)}
                      >
                        +
                      </button>
                      <span className="qty-hint">
                        {formatBDT(p.price)} × {qty} = {formatBDT(p.price * qty)}
                      </span>
                    </div>
                  ) : null}
                </div>
              );
            })}

          {/* Quantity (single mode) */}
          {!multi && (
            <>
              <h2 className="section-label">২. পরিমাণ</h2>
              <div className="qty-row">
                <button
                  type="button"
                  className="qty-btn"
                  aria-label="পরিমাণ কমান"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  −
                </button>
                <span className="qty-value">{quantity}</span>
                <button
                  type="button"
                  className="qty-btn"
                  aria-label="পরিমাণ বাড়ান"
                  disabled={quantity >= 10}
                  onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                >
                  +
                </button>
                <span className="qty-hint">
                  {formatBDT(product.price)} × {quantity} = {formatBDT(subtotal)}
                </span>
              </div>
            </>
          )}

          {/* Delivery area */}
          <h2 className="section-label">{areaStep}. ডেলিভারি এলাকা</h2>
          {areas.map((a) => (
            <label
              key={a.id}
              className={a.id === areaId ? 'option-card selected' : 'option-card'}
            >
              <input
                type="radio"
                name="area"
                value={a.id}
                checked={a.id === areaId}
                onChange={() => setAreaId(a.id)}
              />
              <span className="option-info">
                <strong>{a.label}</strong>
                <small>ক্যাশ অন ডেলিভারি</small>
              </span>
              <span className="option-price">{formatBDT(a.charge)}</span>
            </label>
          ))}

          {/* Order summary */}
          <div className="summary-box">
            <h3>অর্ডার সামারি</h3>
            {lines.map((l) => (
              <div className="summary-row" key={l.product.id}>
                <span>{l.product.name} × {l.quantity}</span>
                <span>{formatBDT(l.product.price * l.quantity)}</span>
              </div>
            ))}
            <div className="summary-row">
              <span>ডেলিভারি চার্জ ({area.label})</span>
              <span>{formatBDT(area.charge)}</span>
            </div>
            <div className="summary-row total">
              <span>সর্বমোট</span>
              <span>{formatBDT(total)}</span>
            </div>
          </div>

          {/* Customer info */}
          <h2 className="section-label">{infoStep}. আপনার তথ্য</h2>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="name">আপনার নাম</label>
              <input
                id="name"
                type="text"
                placeholder="যেমন: মোঃ রহিম উদ্দিন"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="phone">মোবাইল নম্বর</label>
              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                placeholder="01XXXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              {phoneError && <span className="field-error">{phoneError}</span>}
            </div>
            <div className="field">
              <label htmlFor="address">সম্পূর্ণ ঠিকানা</label>
              <textarea
                id="address"
                rows={3}
                placeholder="বাসা/হোল্ডিং, রোড, এলাকা, থানা, জেলা"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>
          </div>

          {formError && <div className="form-error">{formError}</div>}

          <button type="submit" className="cta-btn submit-btn" disabled={sending}>
            {sending ? 'অর্ডার করা হচ্ছে…' : `অর্ডার কনফার্ম করুন — ${formatBDT(total)}`}
          </button>
        </form>
    </div>
  );
}
