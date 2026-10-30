import { redirect } from 'next/navigation';
import Link from 'next/link';
import { isAdminAuthed } from '@/lib/adminAuth';
import {
  isSupabaseConfigured,
  listOrders,
  listProductRows,
} from '@/lib/supabase';
import { formatBDT } from '@/lib/products';

// Admin dashboard (Phase 4): overview stats + latest orders.
// Rendered inside the sidebar shell from app/admin/layout.js.
export const dynamic = 'force-dynamic';

const STATUS_LABELS = {
  pending: 'নতুন',
  confirmed: 'কনফার্ম',
  shipped: 'কুরিয়ারে পাঠানো হয়েছে',
  delivered: 'ডেলিভার্ড',
  cancelled: 'ক্যান্সেল',
};

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleString('bn-BD', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso || '';
  }
}

export default async function AdminDashboardPage() {
  if (!(await isAdminAuthed())) {
    redirect('/admin/login');
  }

  if (!isSupabaseConfigured()) {
    return (
      <div>
        <h1 className="page-title">ড্যাশবোর্ড</h1>
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

  const [ordersRes, productsRes] = await Promise.all([
    listOrders(),
    listProductRows(),
  ]);
  const orders = ordersRes.ok ? ordersRes.data : [];
  const productCount = productsRes.ok ? productsRes.data.length : 0;
  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const totalSales = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const recent = orders.slice(0, 5);

  return (
    <div>
      <h1 className="page-title">ড্যাশবোর্ড</h1>

      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-value">{orders.length}</span>
          <span className="stat-label">মোট অর্ডার</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{pendingCount}</span>
          <span className="stat-label">নতুন / পেন্ডিং</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{formatBDT(totalSales)}</span>
          <span className="stat-label">মোট বিক্রি</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{productCount}</span>
          <span className="stat-label">মোট প্রোডাক্ট</span>
        </div>
      </div>

      <div className="dash-actions">
        <Link href="/admin/orders" className="cta-btn dash-btn">🧾 সব অর্ডার দেখুন</Link>
        <Link href="/admin/products/new" className="cta-btn dash-btn alt">➕ Add New Product</Link>
      </div>

      <h2 className="section-title">সাম্প্রতিক অর্ডার</h2>
      {recent.length === 0 ? (
        <p className="admin-empty">এখনো কোনো অর্ডার আসেনি।</p>
      ) : (
        <div className="order-list">
          {recent.map((o) => (
            <article key={o.id} className="order-card">
              <div className="order-card-top">
                <span className="order-id">{o.id}</span>
                <span className="order-time">{formatTime(o.created_at)}</span>
              </div>
              <div className="order-customer">
                <strong>{o.name}</strong>
                {' · '}
                <a href={`tel:${o.phone}`}>{o.phone}</a>
              </div>
              <div className="order-meta">
                <span>
                  {o.product_name} × {o.quantity}
                </span>
                <span>{STATUS_LABELS[o.status] || o.status}</span>
                <span className="order-total">{formatBDT(o.total)}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
