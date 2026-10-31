import { redirect, notFound } from 'next/navigation';
import { isAdminAuthed } from '@/lib/adminAuth';
import { getPageById, getPageProducts, listProductRows } from '@/lib/supabase';
import PageForm from '../../PageForm';

// Edit a landing page (Phase 5). Rendered inside the sidebar shell.
export const dynamic = 'force-dynamic';

export default async function EditLandingPagePage({ params }) {
  if (!(await isAdminAuthed())) {
    redirect('/admin/login');
  }
  const { id } = await params;
  const { ok, data } = await getPageById(id);
  if (!ok || !data) {
    notFound();
  }

  const [joinedRes, productsRes] = await Promise.all([
    getPageProducts(id),
    listProductRows(),
  ]);
  const selected = {};
  if (joinedRes.ok) {
    for (const p of joinedRes.data) {
      selected[String(p.id)] = p.page_sort || 0;
    }
  }
  const products = productsRes.ok
    ? productsRes.data.map((p) => ({
        id: String(p.id),
        name: String(p.name),
        active: p.active !== false,
      }))
    : [];

  const initial = {
    id: data.id,
    name: data.name || '',
    slug: data.slug || '',
    headline: data.headline || '',
    description: data.description || '',
    selectionMode: data.selection_mode === 'multi' ? 'multi' : 'single',
    deliveryInside:
      data.delivery_inside === null || data.delivery_inside === undefined
        ? ''
        : String(data.delivery_inside),
    deliveryOutside:
      data.delivery_outside === null || data.delivery_outside === undefined
        ? ''
        : String(data.delivery_outside),
    pixelId: data.pixel_id || '',
    active: data.active !== false,
    selected,
  };

  return (
    <div>
      <h1 className="page-title">ল্যান্ডিং পেজ সম্পাদনা</h1>
      <PageForm initial={initial} products={products} />
    </div>
  );
}
