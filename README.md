# Next.js Landing Page Demo — SoundPro X9

Simple conversion-style Bangla landing page (Next.js 15, App Router, plain JS + plain CSS).

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
```

Production:

```bash
npm run build
npm run start
```

## Pages

- `/` — landing page (hero + image slider, benefits, CTA)
- `/checkout` — product variant + quantity + delivery area + order form
- `/thank-you` — order confirmation (reads the order from sessionStorage)
- `POST /api/order` — validates and totals the order server-side, logs it,
  returns `{ ok: true, order }`. Supabase insert is a marked TODO placeholder.

## Notes

- Prices live in `lib/products.js` — shared by the checkout UI and the API
  route so totals always match.
- Set `NEXT_PUBLIC_FB_PIXEL_ID` in `.env.local` to enable the Facebook Pixel
  (PageView on load, Purchase on the thank-you page).
- Product images are local files in `public/images/`.
