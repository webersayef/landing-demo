import { redirect } from 'next/navigation';
import Link from 'next/link';
import { isAdminAuthed } from '@/lib/adminAuth';
import { isSupabaseConfigured, listProductRows } from '@/lib/supabase';
import { formatBDT } from '@/lib/products';
import DeleteButton from './DeleteButton';

// Product list (Phase 4). Rendered inside the sidebar shell.
export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  if (!(await isAdminAuthed())) {
    redirect('/admin/login');
  }

  if (!isSupabaseConfigured()) {
    return (
      <div>
        <h1 className="page-title">প্রোডাক্ট</h1>
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

  const result = await listProductRows();
  const products = result.ok ? result.data : [];

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">প্রোডাক্ট ({products.length})</h1>
        <Link href="/admin/products/new" className="cta-btn add-btn">
          ➕ Add New Product
        </Link>
      </div>

      {!result.ok && (
        <div className="admin-notice">
          <strong>প্রোডাক্টের তালিকা আনা যায়নি।</strong>
          <p>
            সম্ভবত <code>products</code> টেবিল এখনো তৈরি হয়নি — Supabase SQL
            Editor-এ <code>supabase-products-table.sql</code> (বা নতুন
            প্রজেক্টে <code>supabase-setup-all.sql</code>) একবার চালান।
          </p>
        </div>
      )}

      {result.ok && products.length === 0 ? (
        <p className="admin-empty">
          এখনো কোনো প্রোডাক্ট নেই। "Add New Product" দিয়ে প্রথমটি যোগ করুন।
        </p>
      ) : (
        <div className="order-list">
          {products.map((p) => (
            <article key={p.id} className="order-card product-row">
              {p.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image} alt="" className="product-thumb" />
              ) : null}
              <div className="product-info">
                <strong>{p.name}</strong>
                {p.subtitle ? <small>{p.subtitle}</small> : null}
                <span className="product-price">
                  {formatBDT(p.price)}{' '}
                  {p.regular_price ? <s>{formatBDT(p.regular_price)}</s> : null}
                </span>
              </div>
              <div className="product-side">
                <span
                  className={
                    'active-badge' + (p.active ? ' on' : ' off')
                  }
                >
                  {p.active ? 'সক্রিয়' : 'বন্ধ'}
                </span>
                <div className="product-actions">
                  <Link
                    href={`/admin/products/${encodeURIComponent(p.id)}/edit`}
                    className="edit-btn"
                  >
                    সম্পাদনা
                  </Link>
                  <DeleteButton productId={p.id} productName={p.name} />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
