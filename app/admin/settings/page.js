import { redirect } from 'next/navigation';
import { isAdminAuthed } from '@/lib/adminAuth';
import { isSupabaseConfigured, getSiteSettings } from '@/lib/supabase';
import { PRODUCTS, DELIVERY_AREAS } from '@/lib/products';
import SettingsForm from './SettingsForm';

// Settings (Phase 4): delivery charges only — products moved to
// /admin/products. Rendered inside the sidebar shell.
export const dynamic = 'force-dynamic';

function defaults() {
  return {
    basicName: PRODUCTS[0].name,
    basicPrice: PRODUCTS[0].price,
    basicRegularPrice: PRODUCTS[0].regularPrice,
    proName: PRODUCTS[1].name,
    proPrice: PRODUCTS[1].price,
    proRegularPrice: PRODUCTS[1].regularPrice,
    deliveryInside: DELIVERY_AREAS[0].charge,
    deliveryOutside: DELIVERY_AREAS[1].charge,
  };
}

function fromRow(row) {
  return {
    basicName: row.basic_name,
    basicPrice: row.basic_price,
    basicRegularPrice: row.basic_regular_price,
    proName: row.pro_name,
    proPrice: row.pro_price,
    proRegularPrice: row.pro_regular_price,
    deliveryInside: row.delivery_inside,
    deliveryOutside: row.delivery_outside,
  };
}

export default async function AdminSettingsPage() {
  if (!(await isAdminAuthed())) {
    redirect('/admin/login');
  }

  if (!isSupabaseConfigured()) {
    return (
      <div>
        <h1 className="page-title">সেটিংস</h1>
        <div className="admin-notice">
          <strong>ডাটাবেস এখনো সেটআপ হয়নি।</strong>
          <p>
            সার্ভারে <code>SUPABASE_URL</code> এবং{' '}
            <code>SUPABASE_SERVICE_ROLE_KEY</code> এনভায়রনমেন্ট ভ্যারিয়েবল
            সেট করতে হবে। বিস্তারিত ধাপ README.md-তে দেওয়া আছে।
          </p>
        </div>
      </div>
    );
  }

  const { ok, data } = await getSiteSettings();
  const initial = ok && data ? fromRow(data) : defaults();

  return (
    <div>
      <h1 className="page-title">সেটিংস</h1>
      <SettingsForm initial={initial} />
    </div>
  );
}
