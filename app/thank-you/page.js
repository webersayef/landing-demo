'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { trackPurchase } from '@/components/FacebookPixel';
import { formatBDT } from '@/lib/products';

export default function ThankYouPage() {
  const [order, setOrder] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('lastOrder');
      if (raw) {
        const parsed = JSON.parse(raw);
        setOrder(parsed);
        // Fire the Facebook Purchase event once for this order.
        trackPurchase(parsed);
      }
    } catch {
      // ignore malformed storage
    }
    setLoaded(true);
  }, []);

  if (!loaded) return <main />;

  if (!order) {
    return (
      <main>
        <div className="thanks-wrap">
          <div className="thanks-icon">🛍️</div>
          <h1>কোনো সাম্প্রতিক অর্ডার পাওয়া যায়নি</h1>
          <p className="thanks-sub">
            মনে হচ্ছে আপনি এখনো কোনো অর্ডার করেননি। প্রোডাক্ট পেজে গিয়ে
            পছন্দের প্রোডাক্টটি অর্ডার করুন।
          </p>
          <Link href="/" className="cta-btn home-btn">
            হোম পেজে যান
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="thanks-wrap">
        <div className="thanks-icon">✅</div>
        <h1>ধন্যবাদ! আপনার অর্ডারটি সফলভাবে গৃহীত হয়েছে 🎉</h1>
        <p className="thanks-sub">
          আমাদের টিম খুব শীঘ্রই <strong>{order.phone}</strong> নম্বরে কল করে
          অর্ডারটি কনফার্ম করবে। অনুগ্রহ করে ফোনটি হাতের কাছে রাখুন।
          পণ্য হাতে পেয়ে ক্যাশ পেমেন্ট করলেই চলবে।
        </p>

        <div className="order-box">
          <div className="summary-row">
            <span>অর্ডার আইডি</span>
            <strong>{order.id}</strong>
          </div>
          <div className="summary-row">
            <span>প্রোডাক্ট</span>
            <span>{order.productName}</span>
          </div>
          <div className="summary-row">
            <span>পরিমাণ</span>
            <span>{order.quantity}টি</span>
          </div>
          <div className="summary-row">
            <span>প্রোডাক্টের মূল্য</span>
            <span>{formatBDT(order.subtotal)}</span>
          </div>
          <div className="summary-row">
            <span>ডেলিভারি এলাকা</span>
            <span>{order.areaLabel}</span>
          </div>
          <div className="summary-row">
            <span>ডেলিভারি চার্জ</span>
            <span>{formatBDT(order.deliveryCharge)}</span>
          </div>
          <div className="summary-row total">
            <span>সর্বমোট (ক্যাশ অন ডেলিভারি)</span>
            <span>{formatBDT(order.total)}</span>
          </div>
        </div>

        <Link href="/" className="cta-btn home-btn">
          হোম পেজে ফিরুন
        </Link>
      </div>
    </main>
  );
}
