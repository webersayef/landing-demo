import { notFound } from 'next/navigation';
import LandingView from '@/components/LandingView';
import { getPageCatalog } from '@/lib/catalog';

// A single landing page (Phase 5), managed at /admin/pages and
// rendered with the same template as the homepage. Unknown or
// inactive slugs — and sites where the Phase 5 SQL has not run
// yet — resolve to null in getPageCatalog and become a 404 here.
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const catalog = await getPageCatalog(slug);
  if (!catalog) return {};
  return {
    title: `${catalog.page.name} — অর্ডার করুন`,
    description: catalog.page.description || undefined,
  };
}

export default async function LandingPage({ params }) {
  const { slug } = await params;
  const catalog = await getPageCatalog(slug);
  if (!catalog) {
    notFound();
  }
  const { page, products, areas } = catalog;
  return (
    <LandingView
      products={products}
      areas={areas}
      headline={page.headline || page.name}
      description={page.description}
      selectionMode={page.selectionMode}
      pageSlug={page.slug}
      pixelId={page.pixelId}
      brand={page.name || 'SoundPro X9'}
      productName={products[0] ? products[0].subtitle || products[0].name : page.name}
    />
  );
}
