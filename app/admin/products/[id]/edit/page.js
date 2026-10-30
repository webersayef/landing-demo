import { redirect, notFound } from 'next/navigation';
import { isAdminAuthed } from '@/lib/adminAuth';
import { getProductRow } from '@/lib/supabase';
import ProductForm from '../../ProductForm';

// Edit product (Phase 4). Rendered inside the sidebar shell.
export const dynamic = 'force-dynamic';

export default async function EditProductPage({ params }) {
  if (!(await isAdminAuthed())) {
    redirect('/admin/login');
  }
  const { id } = await params;
  const { ok, data } = await getProductRow(id);
  if (!ok || !data) {
    notFound();
  }
  const initial = {
    id: data.id,
    name: data.name,
    subtitle: data.subtitle || '',
    price: data.price,
    regularPrice: data.regular_price || 0,
    image: data.image || '',
    active: data.active !== false,
    sort: data.sort || 0,
  };
  return (
    <div>
      <h1 className="page-title">প্রোডাক্ট সম্পাদনা</h1>
      <ProductForm initial={initial} />
    </div>
  );
}
