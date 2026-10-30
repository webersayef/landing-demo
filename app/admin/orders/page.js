import { redirect } from 'next/navigation';
import { isAdminAuthed } from '@/lib/adminAuth';
import { isSupabaseConfigured, listOrders } from '@/lib/supabase';
import { formatBDT } from '@/lib/products';
import StatusSelect from './StatusSelect';

// All orders (moved from /admin in Phase 4 — /admin is now the
// dashboard). Rendered inside the sidebar shell.
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

export default async function AdminOrdersPage() {
  if (!(await isAdminAuthed())) {
    redirect('/admin/login');
  }

  if (!isSupabaseConfigured()) {
    return (
      <div>
        <h1 className="page-title">অর্ডারসমূহ</h1>
        <div className="admin-notice">
          <strong>ডাটাবেস এখনো সেটআপ হয়নি।</strong>
          <p>
            অর্ডার দেখতে সার্ভারে <code>SUPABASE_URL</code> এবং{' '}
            <code>SUPABASE_SERVICE_ROLE_KEY</code> এনভায়রনমেন্ট ভ্যারিয়েবল
            সেট করতে হবে। বিস্তারিত ধাপ README.md-তে দেওয়া আছে।
          </p>
        </div>
      </div>
    );
  }

  const result = await listOrders();
  const orders = result.ok ? result.data : [];

  return (
    <div>
      <h1 className="page-title">অর্ডারসমূহ ({orders.length})</h1>

      {!result.ok && (
        <div className="form-error">
          অর্ডারের তালিকা আনা যায়নি: {result.error}
        </div>
      )}

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
    </div>
  );
}
