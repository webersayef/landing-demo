import { redirect } from 'next/navigation';
import { isAdminAuthed } from '@/lib/adminAuth';
import { listProductRows } from '@/lib/supabase';
import PageForm from '../PageForm';

// Create a new landing page (Phase 5). Rendered inside the
// sidebar shell.
export const dynamic = 'force-dynamic';

export default async function NewLandingPagePage() {
  if (!(await isAdminAuthed())) {
    redirect('/admin/login');
  }
  const productsRes = await listProductRows();
  const products = productsRes.ok
    ? productsRes.data.map((p) => ({
        id: String(p.id),
        name: String(p.name),
        active: p.active !== false,
      }))
    : [];
  return (
    <div>
      <h1 className="page-title">নতুন ল্যান্ডিং পেজ</h1>
      <PageForm initial={null} products={products} />
    </div>
  );
}
