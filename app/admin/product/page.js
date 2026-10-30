import { redirect } from 'next/navigation';

// Phase 4: the old "প্রোডাক্ট ও দাম" page split into
// /admin/products (product CRUD) and /admin/settings (delivery
// charges). Keep this old URL working via redirect.
export default function OldProductPageRedirect() {
  redirect('/admin/settings');
}
