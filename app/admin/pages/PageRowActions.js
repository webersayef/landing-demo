'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Duplicate + Delete buttons for one row of /admin/pages.
export default function PageRowActions({ pageId, pageName }) {
  const router = useRouter();
  const [busy, setBusy] = useState('');

  async function onDuplicate() {
    setBusy('dup');
    try {
      const res = await fetch('/api/admin/pages/duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: pageId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || 'dup failed');
      router.refresh();
    } catch (err) {
      alert(err.message && err.message !== 'dup failed' ? err.message : 'কপি করা যায়নি, আবার চেষ্টা করুন।');
    } finally {
      setBusy('');
    }
  }

  async function onDelete() {
    const sure = window.confirm(
      `"${pageName}" ল্যান্ডিং পেজটি মুছে ফেলতে চান? এই কাজ ফিরিয়ে আনা যাবে না।`
    );
    if (!sure) return;
    setBusy('del');
    try {
      const res = await fetch(
        `/api/admin/pages?id=${encodeURIComponent(pageId)}`,
        { method: 'DELETE' }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error('delete failed');
      router.refresh();
    } catch {
      alert('মুছা যায়নি, আবার চেষ্টা করুন।');
      setBusy('');
    }
  }

  return (
    <>
      <button
        type="button"
        className="edit-btn"
        onClick={onDuplicate}
        disabled={Boolean(busy)}
      >
        {busy === 'dup' ? 'কপি হচ্ছে…' : 'কপি করুন'}
      </button>
      <button
        type="button"
        className="danger-btn"
        onClick={onDelete}
        disabled={Boolean(busy)}
      >
        {busy === 'del' ? 'মুছা হচ্ছে…' : 'মুছুন'}
      </button>
    </>
  );
}
