import { redirect } from 'next/navigation';
import Link from 'next/link';
import { isAdminAuthed } from '@/lib/adminAuth';
import { isSupabaseConfigured, getSiteSettings } from '@/lib/supabase';
import { PRODUCTS, DELIVERY_AREAS } from '@/lib/products';
import LogoutButton from '../LogoutButton';
import ProductForm from './ProductForm';

// Always render fresh — settings must reflect the latest save.
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

export default async function AdminProductPage() {
  if (!(await isAdminAuthed())) {
    redirect('/admin/login');
  }

  const header = (
    <div className="admin-header">
      <h1>প্রোডাক্ট ও দাম</h1>
      <div className="admin-actions">
        <Link href="/admin" className="admin-nav-link">অর্ডারসমূহ</Link>
        <LogoutButton />
      </div>
    </div>
  );

  if (!isSupabaseConfigured()) {
    return (
      <main className="admin-wrap">
        {header}
        <div className="admin-notice">
          <strong>ডাটাবেস এখনো সেটআপ হয়নি।</strong>
          <p>
            দাম বদলাতে সার্ভারে <code>SUPABASE_URL</code> এবং{' '}
            <code>SUPABASE_SERVICE_ROLE_KEY</code> এনভায়রনমেন্ট ভ্যারিয়েবল
            সেট করতে হবে, আর Supabase-এ <code>supabase-products.sql</code>{' '}
            একবার চালাতে হবে। বিস্তারিত ধাপ README.md-তে দেওয়া আছে।
          </p>
        </div>
      </main>
    );
  }

  const { ok, data } = await getSiteSettings();
  const initial = ok && data ? fromRow(data) : defaults();

  return (
    <main className="admin-wrap">
      {header}
      {(!ok || !data) && (
        <div className="admin-notice">
          <strong>এখনো ডাটাবেসে সেটিংস সেভ হয়নি।</strong>
          <p>
            নিচে কোডের ডিফল্ট দাম দেখানো হচ্ছে — একবার সেভ করলেই তা
            ডাটাবেসে জমা হয়ে যাবে এবং সাইট ওই দামই ব্যবহার করবে।
          </p>
        </div>
      )}
      <ProductForm initial={initial} />
    </main>
  );
}
