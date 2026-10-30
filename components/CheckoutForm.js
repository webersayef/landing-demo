'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatBDT, isValidBdPhone } from '@/lib/products';

// Embedded checkout form (Phase 4.1): the landing page is a
// single page — this form renders at the bottom of the home page
// inside the #checkout section, and the "অর্ডার করুন" buttons
// scroll to it. Product/price data arrives as props from the
// server page, which reads it from the database (lib/catalog.js).
export default function CheckoutForm({ products, areas }) {
  const router = useRouter();
  const [productId, setProductId] = useState(products[0].id);
  const [quantity, setQuantity] = useState(1);
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
  const subtotal = product.price * quantity;
  const total = subtotal + area.charge;

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

    setSending(true);
    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          productId,
          quantity,
          areaId,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'order failed');
      }
      sessionStorage.setItem('lastOrder', JSON.stringify(data.order));
      router.push('/thank-you');
    } catch {
      setFormError(
        'দুঃখিত, অর্ডারটি সম্পন্ন করা যায়নি। আবার চেষ্টা করুন অথবা কল করুন 01741-783703 নম্বরে।'
      );
      setSending(false);
    }
  }

  return (
    <div className="checkout-wrap">
        <h1>অর্ডার ফর্ম</h1>
        <p>ক্যাশ অন ডেলিভারি — ফর্মটি পূরণ করুন, আমরাই কল করে কনফার্ম করব।</p>

        <form onSubmit={handleSubmit} noValidate>
          {/* Product selection */}
          <h2 className="section-label">১. প্রোডাক্ট সিলেক্ট করুন</h2>
          {products.map((p) => (
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

          {/* Quantity */}
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

          {/* Delivery area */}
          <h2 className="section-label">৩. ডেলিভারি এলাকা</h2>
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
            <div className="summary-row">
              <span>{product.name} × {quantity}</span>
              <span>{formatBDT(subtotal)}</span>
            </div>
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
          <h2 className="section-label">৪. আপনার তথ্য</h2>
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
