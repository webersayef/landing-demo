import { redirect } from 'next/navigation';
import Link from 'next/link';
import { isAdminAuthed } from '@/lib/adminAuth';
import { isSupabaseConfigured, listOrders } from '@/lib/supabase';
import { formatBDT } from '@/lib/products';
import LogoutButton from './LogoutButton';
import StatusSelect from './StatusSelect';

// Always render fresh — orders must never come from a static cache.
export const dynamic = 'force-dynamic';

const AREA_LABELS = {
  inside: 'ঢাকার ভিতরে',
  outside: 'ঢাকার বাইরে',
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

export default async function AdminPage() {
  if (!(await isAdminAuthed())) {
    redirect('/admin/login');
  }

  if (!isSupabaseConfigured()) {
    return (
      <main className="admin-wrap">
        <div className="admin-header">
          <h1>অর্ডারসমূহ</h1>
          <div className="admin-actions">
            <Link href="/admin/product" className="admin-nav-link">প্রোডাক্ট ও দাম</Link>
            <LogoutButton />
          </div>
        </div>
        <div className="admin-notice">
          <strong>ডাটাবেস এখনো সেটআপ হয়নি।</strong>
          <p>
            অর্ডার দেখতে সার্ভারে <code>SUPABASE_URL</code> এবং{' '}
            <code>SUPABASE_SERVICE_ROLE_KEY</code> এনভায়রনমেন্ট ভ্যারিয়েবল
            সেট করতে হবে (Vercel → Project → Settings → Environment
            Variables), তারপর Redeploy করতে হবে। বিস্তারিত ধাপ README.md-তে
            দেওয়া আছে।
          </p>
        </div>
      </main>
    );
  }

  const result = await listOrders();
  const orders = result.ok ? result.data : [];
  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const totalSales = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  return (
    <main className="admin-wrap">
      <div className="admin-header">
        <h1>অর্ডারসমূহ</h1>
        <div className="admin-actions">
          <Link href="/admin/product" className="admin-nav-link">প্রোডাক্ট ও দাম</Link>
          <LogoutButton />
        </div>
      </div>

      {!result.ok && (
        <div className="form-error">
          অর্ডারের তালিকা আনা যায়নি: {result.error}
        </div>
      )}

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
      </div>

      {orders.length === 0 ? (
        <p className="admin-empty">এখনো কোনো অর্ডার আসেনি।</p>
      ) : (
        <div className="order-list">
          {orders.map((o) => (
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
              <p className="order-address">{o.address}</p>
              <div className="order-meta">
                <span>
                  {o.product_name} × {o.quantity}
                </span>
                <span>{AREA_LABELS[o.delivery_area] || o.delivery_area}</span>
              </div>
              <div className="order-card-bottom">
                <span className="order-total">{formatBDT(o.total)}</span>
                <StatusSelect orderId={o.id} initialStatus={o.status} />
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
