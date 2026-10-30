'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteButton({ productId, productName }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    const sure = window.confirm(
      `"${productName}" প্রোডাক্টটি মুছে ফেলতে চান? এই কাজ ফিরিয়ে আনা যাবে না।`
    );
    if (!sure) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/admin/products?id=${encodeURIComponent(productId)}`,
        { method: 'DELETE' }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error('delete failed');
      router.refresh();
    } catch {
      alert('মুছা যায়নি, আবার চেষ্টা করুন।');
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className="danger-btn"
      onClick={onDelete}
      disabled={busy}
    >
      {busy ? 'মুছা হচ্ছে…' : 'মুছুন'}
    </button>
  );
}
