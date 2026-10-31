import ImageSlider from '@/components/ImageSlider';
import CheckoutForm from '@/components/CheckoutForm';
import Pixel from '@/components/Pixel';
import { formatBDT } from '@/lib/products';

// Shared landing-page template (Phase 5): the homepage and every
// /lp/[slug] page render through this one component, so all pages
// share the exact same design. It is a server component; the
// slider, checkout form and pixel are client components.
//
// Props:
//   products       catalog-shaped products (checkout + hero price)
//   areas          [{ id, label, charge }] delivery areas
//   headline       hero hook line
//   description    hero sub text
//   selectionMode  'single' | 'multi' (checkout behaviour)
//   pageSlug       slug of the landing page (null on the homepage)
//   pixelId        Meta pixel id for this page ('' = none)
//   brand          top-bar brand text
//   productName    slider image alt text

const PHONE = '01741-783703';

const FALLBACK_IMAGES = [
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

export default function LandingView({
  products,
  areas,
  headline,
  description,
  selectionMode = 'single',
  pageSlug = null,
  pixelId = '',
  brand = 'SoundPro X9',
  productName = 'SoundPro X9 ওয়্যারলেস হেডফোন',
}) {
  const first = products[0] || null;
  const OFFER_PRICE = first ? first.price : 0;
  const REGULAR_PRICE = first ? first.regularPrice : 0;

  // Hero slider: the products' own images (in page order) when
  // any are set; otherwise the local demo photos.
  const productImages = [...new Set(products.map((p) => p.image).filter(Boolean))];
  const sliderImages = productImages.length ? productImages : FALLBACK_IMAGES;

  return (
    <main>
      {pixelId ? (
        <Pixel
          pixelId={pixelId}
          product={
            first
              ? { id: first.id, name: first.name, price: first.price }
              : null
          }
        />
      ) : null}

      {/* ── Slim top bar ─────────────────────────────── */}
      <header className="topbar">
        <span className="brand">{brand}</span>
        <a className="topbar-phone" href={`tel:${PHONE.replace(/-/g, '')}`}>
          📞 {PHONE}
        </a>
      </header>

      {/* ── HERO ─────────────────────────────────────── */}
      <section className="hero">
        <h1 className="hero-hook">{headline}</h1>
        <p className="hero-sub">{description}</p>

        <ImageSlider images={sliderImages} alt={productName} />

        {first ? (
          <div className="price-block">
            <span className="price-now">{formatBDT(OFFER_PRICE)}</span>
            {REGULAR_PRICE > OFFER_PRICE ? (
              <>
                <span className="price-was">{formatBDT(REGULAR_PRICE)}</span>
                <span className="price-badge">
                  {Math.round((1 - OFFER_PRICE / REGULAR_PRICE) * 100)}% ছাড়
                </span>
              </>
            ) : null}
          </div>
        ) : null}

        <a href="#checkout" className="cta-btn">
          অর্ডার করুন
        </a>
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
      {first ? (
        <section className="final-cta">
          <p className="final-cta-text">
            আজকের অফার প্রাইস মাত্র{' '}
            <strong>{formatBDT(OFFER_PRICE)}</strong>{' '}
            {REGULAR_PRICE > OFFER_PRICE ? <s>{formatBDT(REGULAR_PRICE)}</s> : null}
          </p>
          <a href="#checkout" className="cta-btn">
            অর্ডার করুন
          </a>
        </section>
      ) : null}

      {/* ── CHECKOUT (same page — buttons scroll here) ── */}
      <section id="checkout" className="checkout-section">
        {first ? (
          <CheckoutForm
            products={products}
            areas={areas}
            selectionMode={selectionMode}
            pageSlug={pageSlug}
            pixelId={pixelId}
          />
        ) : (
          <div className="checkout-wrap">
            <h1>অর্ডার ফর্ম</h1>
            <p>এই পেজে এখনো কোনো প্রোডাক্ট যোগ করা হয়নি।</p>
          </div>
        )}
      </section>

      <footer className="footer">
        <p>© 2026 {brand} — সর্বস্বত্ব সংরক্ষিত</p>
        <p>
          যেকোনো প্রয়োজনে কল করুন:{' '}
          <a href={`tel:${PHONE.replace(/-/g, '')}`}>{PHONE}</a>
        </p>
      </footer>

      {/* Sticky bottom order bar (mobile) */}
      {first ? (
        <div className="sticky-bar">
          <div className="sticky-price">
            <strong>{formatBDT(OFFER_PRICE)}</strong>
            {REGULAR_PRICE > OFFER_PRICE ? <s>{formatBDT(REGULAR_PRICE)}</s> : null}
          </div>
          <a href="#checkout" className="cta-btn sticky-btn">
            অর্ডার করুন
          </a>
        </div>
      ) : null}
    </main>
  );
}
