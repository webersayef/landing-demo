'use client';

import { useEffect } from 'react';

// Per-page Meta (Facebook) Pixel (Phase 5). Given a pixel id,
// injects the standard snippet once per id, fires PageView, and
// fires ViewContent when product info is passed.
//
// The layout's FacebookPixel (env NEXT_PUBLIC_FB_PIXEL_ID) shares
// the window.__pixelInited registry, so when a landing view uses
// the SAME id as the env pixel, init + PageView still fire only
// once in total — never twice.

// Load fbevents.js and register `pixelId` (init + PageView) the
// first time it is seen. Safe to call repeatedly.
export function ensurePixel(pixelId) {
  if (!pixelId || typeof window === 'undefined') return false;
  window.__pixelInited = window.__pixelInited || [];
  if (window.__pixelInited.includes(pixelId)) {
    return typeof window.fbq === 'function';
  }
  // Standard Meta pixel snippet (creates the fbq queue stub).
  // eslint-disable-next-line func-names
  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () {
      // eslint-disable-next-line prefer-spread, prefer-rest-params
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  if (typeof window.fbq !== 'function') return false;
  window.fbq('init', pixelId);
  window.fbq('track', 'PageView');
  window.__pixelInited.push(pixelId);
  return true;
}

// Fire an event on ONE specific pixel (used for the per-page
// Purchase on the thank-you page, where several pixels may be
// loaded but only the page's own pixel should get the event).
export function trackOnPixel(pixelId, event, params) {
  if (!ensurePixel(pixelId)) return;
  window.fbq('trackSingle', pixelId, event, params || {});
}

export default function Pixel({ pixelId, product }) {
  useEffect(() => {
    if (!pixelId) return;
    if (ensurePixel(pixelId) && product) {
      window.fbq('trackSingle', pixelId, 'ViewContent', {
        content_ids: [product.id],
        content_name: product.name,
        content_type: 'product',
        value: Number(product.price) || 0,
        currency: 'BDT',
      });
    }
  }, [pixelId, product]);

  if (!pixelId) return null;
  return (
    <noscript>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        height="1"
        width="1"
        style={{ display: 'none' }}
        src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
        alt=""
      />
    </noscript>
  );
}
