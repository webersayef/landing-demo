import { redirect } from 'next/navigation';
import { isAdminAuthed } from '@/lib/adminAuth';
import ProductForm from '../ProductForm';

// Add New Product (Phase 4). Rendered inside the sidebar shell.
export const dynamic = 'force-dynamic';

export default async function NewProductPage() {
  if (!(await isAdminAuthed())) {
    redirect('/admin/login');
  }
  return (
    <div>
      <h1 className="page-title">Add New Product</h1>
      <ProductForm initial={null} />
    </div>
  );
}
