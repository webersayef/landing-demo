import { redirect } from 'next/navigation';
import Link from 'next/link';
import { isAdminAuthed } from '@/lib/adminAuth';
import { isSupabaseConfigured, listPages, getPageProducts } from '@/lib/supabase';
import PageRowActions from './PageRowActions';

// Landing page list (Phase 5). Rendered inside the sidebar shell.
export const dynamic = 'force-dynamic';

export default async function AdminPagesPage() {
  if (!(await isAdminAuthed())) {
    redirect('/admin/login');
  }

  if (!isSupabaseConfigured()) {
    return (
      <div>
        <h1 className="page-title">ল্যান্ডিং পেজসমূহ</h1>
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

  const result = await listPages();
  const pages = result.ok ? result.data : [];
  const counts = {};
  if (result.ok) {
    await Promise.all(
      pages.map(async (p) => {
        const joined = await getPageProducts(p.id);
        counts[p.id] = joined.ok ? joined.data.length : 0;
      })
    );
  }

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">ল্যান্ডিং পেজসমূহ ({pages.length})</h1>
        <Link href="/admin/pages/new" className="cta-btn add-btn">
          ➕ নতুন ল্যান্ডিং পেজ
        </Link>
      </div>

      {!result.ok && (
        <div className="admin-notice">
          <strong>পেজের তালিকা আনা যায়নি।</strong>
          <p>
            সম্ভবত Phase 5-এর টেবিল এখনো তৈরি হয়নি — Supabase SQL Editor-এ{' '}
            <code>supabase-phase5.sql</code> ফাইলটি একবার চালান।
          </p>
        </div>
      )}

      {result.ok && pages.length === 0 ? (
        <p className="admin-empty">
          এখনো কোনো ল্যান্ডিং পেজ নেই। "নতুন ল্যান্ডিং পেজ" দিয়ে প্রথমটি তৈরি করুন।
        </p>
      ) : (
        <div className="order-list">
          {pages.map((p) => (
            <article key={p.id} className="order-card product-row">
              <div className="product-info">
                <strong>{p.name}</strong>
                <small>
                  /lp/{p.slug} · {counts[p.id] ?? 0}টি প্রোডাক্ট ·{' '}
                  {p.selection_mode === 'multi' ? 'একাধিক সিলেকশন' : 'একটি সিলেকশন'}
                </small>
              </div>
              <div className="product-side">
                <span className={'active-badge' + (p.active ? ' on' : ' off')}>
                  {p.active ? 'সক্রিয়' : 'বন্ধ'}
                </span>
                <div className="product-actions">
                  <a
                    href={`/lp/${encodeURIComponent(p.slug)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="edit-btn"
                  >
                    দেখুন
                  </a>
                  <Link
                    href={`/admin/pages/${encodeURIComponent(p.id)}/edit`}
                    className="edit-btn"
                  >
                    সম্পাদনা
                  </Link>
                  <PageRowActions pageId={p.id} pageName={p.name} />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
