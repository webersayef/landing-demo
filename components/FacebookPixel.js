'use client';

import Script from 'next/script';
import { useEffect } from 'react';

// Injects the Facebook Pixel base code ONLY when NEXT_PUBLIC_FB_PIXEL_ID
// is set in the environment. Without the env var this renders nothing.
const PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID;

export default function FacebookPixel() {
  if (!PIXEL_ID) return null;

  return (
    <>
      <Script id="fb-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${PIXEL_ID}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}

// Helper: fire a Purchase event (used on the thank-you page).
export function trackPurchase(order) {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function' && order) {
    window.fbq('track', 'Purchase', {
      value: Number(order.total) || 0,
      currency: 'BDT',
      contents: [{ id: order.productId, quantity: order.quantity }],
      content_type: 'product',
    });
  }
}
