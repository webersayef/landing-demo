import Link from 'next/link';
import ImageSlider from '@/components/ImageSlider';
import { formatBDT } from '@/lib/products';

const PRODUCT_NAME = 'SoundPro X9 ওয়্যারলেস হেডফোন';
const OFFER_PRICE = 1250;
const REGULAR_PRICE = 1800;
const PHONE = '01741-783703';

const SLIDER_IMAGES = [
  '/images/headphone-1.jpg',
  '/images/headphone-2.webp',
  '/images/headphone-3.jpg',
  '/images/headphone-4.webp',
];

const BENEFITS = [
  'একবার চার্জে টানা ৪০ ঘণ্টা ব্যাটারি ব্যাকআপ',
  'শক্তিশালী ডিপ বেস — গান আর মুভিতে সিনেমা হলের অভিজ্ঞতা',
  'সর্বশেষ Bluetooth 5.3 — দ্রুত ও স্থির কানেকশন',
  'নরম কুশন ইয়ারকাপ — ঘণ্টার পর ঘণ্টা পরে থাকলেও ব্যথা নেই',
  'বিল্ট-ইন মাইকে ক্রিস্টাল ক্লিয়ার কল কোয়ালিটি',
  'হালকা ও ভাঁজ করা যায় — ভ্রমণে সহজে বহনযোগ্য',
];

export default function HomePage() {
  return (
    <main>
      {/* ── Slim top bar ─────────────────────────────── */}
      <header className="topbar">
        <span className="brand">SoundPro X9</span>
        <a className="topbar-phone" href={`tel:${PHONE.replace(/-/g, '')}`}>
          📞 {PHONE}
        </a>
      </header>

      {/* ── HERO ─────────────────────────────────────── */}
      <section className="hero">
        <h1 className="hero-hook">
          একবার চার্জে ৪০ ঘণ্টা! ডিপ বেসে কাঁপবে পুরো রুম 🎧
        </h1>
        <p className="hero-sub">
          {PRODUCT_NAME} — Bluetooth 5.3, সুপার কমফোর্ট কুশন আর দারুণ সাউন্ড।
          স্টক সীমিত, অফার শেষ হওয়ার আগেই অর্ডার করুন!
        </p>

        <ImageSlider images={SLIDER_IMAGES} alt={PRODUCT_NAME} />

        <div className="price-block">
          <span className="price-now">{formatBDT(OFFER_PRICE)}</span>
          <span className="price-was">{formatBDT(REGULAR_PRICE)}</span>
          <span className="price-badge">
            {Math.round((1 - OFFER_PRICE / REGULAR_PRICE) * 100)}% ছাড়
          </span>
        </div>

        <Link href="/checkout" className="cta-btn">
          অর্ডার করুন
        </Link>
        <p className="hero-note">🚚 ক্যাশ অন ডেলিভারি — পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন</p>
      </section>

      {/* ── BODY: benefits + trust ───────────────────── */}
      <section className="benefits">
        <h2>কেন এই প্রোডাক্টটি কিনবেন?</h2>
        <ul className="benefit-list">
          {BENEFITS.map((b) => (
            <li key={b}>
              <span className="check">✔</span> {b}
            </li>
          ))}
        </ul>

        <div className="trust-grid">
          <div className="trust-item">
            <div className="trust-icon">💵</div>
            <strong>ক্যাশ অন ডেলিভারি</strong>
            <span>পণ্য হাতে পেয়ে টাকা দিন</span>
          </div>
          <div className="trust-item">
            <div className="trust-icon">🚚</div>
            <strong>সারাদেশে ডেলিভারি</strong>
            <span>ঢাকায় ২৪–৪৮ ঘণ্টায় ডেলিভারি</span>
          </div>
          <div className="trust-item">
            <div className="trust-icon">↩️</div>
            <strong>সহজ রিটার্ন</strong>
            <span>ত্রুটিপূর্ণ পণ্যে সহজ রিপ্লেসমেন্ট</span>
          </div>
        </div>
      </section>

      {/* ── Final CTA + footer ───────────────────────── */}
      <section className="final-cta">
        <p className="final-cta-text">
          আজকের অফার প্রাইস মাত্র{' '}
          <strong>{formatBDT(OFFER_PRICE)}</strong>{' '}
          <s>{formatBDT(REGULAR_PRICE)}</s>
        </p>
        <Link href="/checkout" className="cta-btn">
          অর্ডার করুন
        </Link>
      </section>

      <footer className="footer">
        <p>© 2026 SoundPro X9 — সর্বস্বত্ব সংরক্ষিত</p>
        <p>
          যেকোনো প্রয়োজনে কল করুন:{' '}
          <a href={`tel:${PHONE.replace(/-/g, '')}`}>{PHONE}</a>
        </p>
      </footer>

      {/* Sticky bottom order bar (mobile) */}
      <div className="sticky-bar">
        <div className="sticky-price">
          <strong>{formatBDT(OFFER_PRICE)}</strong>
          <s>{formatBDT(REGULAR_PRICE)}</s>
        </div>
        <Link href="/checkout" className="cta-btn sticky-btn">
          অর্ডার করুন
        </Link>
      </div>
    </main>
  );
}
