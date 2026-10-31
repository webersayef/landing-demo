'use client';

import { useEffect, useRef } from 'react';
import { trackOnPixel } from '@/components/Pixel';

// Fires the Meta Purchase event on the LANDING PAGE's own pixel
// (Phase 5). CheckoutForm stores the page's pixel id in
// sessionStorage ('fb_pixel_id') just before redirecting here;
// this component reads it, fires Purchase once with the order
// total, and clears the stored id so a refresh never re-fires.
//
// When the stored id is the env pixel (NEXT_PUBLIC_FB_PIXEL_ID),
// it does nothing beyond clearing — that pixel's Purchase is
// already fired by the thank-you page's existing tracker.
export default function PixelPurchase({ order }) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (!order || firedRef.current) return;
    let storedId = '';
    try {
      storedId = sessionStorage.getItem('fb_pixel_id') || '';
      if (storedId) sessionStorage.removeItem('fb_pixel_id');
    } catch {
      // storage unavailable — nothing to do
    }
    if (!storedId) return;
    if (storedId === (process.env.NEXT_PUBLIC_FB_PIXEL_ID || '')) return;
    firedRef.current = true;
    trackOnPixel(storedId, 'Purchase', {
      value: Number(order.total) || 0,
      currency: 'BDT',
    });
  }, [order]);

  return null;
}
