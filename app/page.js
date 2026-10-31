import LandingView from '@/components/LandingView';
import { getCatalog } from '@/lib/catalog';

// Prices come from the database (editable in /admin/products), so
// this page renders fresh on every request. The markup lives in
// components/LandingView.js, shared with /lp/[slug] pages; the
// homepage passes the original headline/description and the env
// pixel id, so it looks and behaves exactly as before Phase 5.
export const dynamic = 'force-dynamic';

const HEADLINE = 'একবার চার্জে ৪০ ঘণ্টা! ডিপ বেসে কাঁপবে পুরো রুম 🎧';
const DESCRIPTION =
  'SoundPro X9 ওয়্যারলেস হেডফোন — Bluetooth 5.3, সুপার কমফোর্ট কুশন আর দারুণ সাউন্ড। স্টক সীমিত, অফার শেষ হওয়ার আগেই অর্ডার করুন!';

export default async function HomePage() {
  const { products, areas } = await getCatalog();
  return (
    <LandingView
      products={products}
      areas={areas}
      headline={HEADLINE}
      description={DESCRIPTION}
      selectionMode="single"
      pageSlug={null}
      pixelId={process.env.NEXT_PUBLIC_FB_PIXEL_ID || ''}
      brand="SoundPro X9"
      productName="SoundPro X9 ওয়্যারলেস হেডফোন"
    />
  );
}
