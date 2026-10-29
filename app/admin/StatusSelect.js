'use client';

import { useState } from 'react';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'নতুন' },
  { value: 'confirmed', label: 'কনফার্ম' },
  { value: 'shipped', label: 'কুরিয়ারে পাঠানো হয়েছে' },
  { value: 'delivered', label: 'ডেলিভার্ড' },
  { value: 'cancelled', label: 'ক্যান্সেল' },
];

export default function StatusSelect({ orderId, initialStatus }) {
  const [status, setStatus] = useState(initialStatus || 'pending');
  const [savedStatus, setSavedStatus] = useState(initialStatus || 'pending');
  const [state, setState] = useState(''); // '', 'saving', 'saved', 'error'

  async function onChange(e) {
    const next = e.target.value;
    setStatus(next);
    setState('saving');
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setSavedStatus(next);
        setState('saved');
      } else {
        setStatus(savedStatus);
        setState('error');
      }
    } catch {
      setStatus(savedStatus);
      setState('error');
    }
  }

  return (
    <span className="status-cell">
      <select
        className="status-select"
        value={status}
        onChange={onChange}
        aria-label="অর্ডারের স্ট্যাটাস"
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {state === 'saving' && <span className="status-note">সেভ হচ্ছে…</span>}
      {state === 'saved' && <span className="status-note status-ok">সেভ হয়েছে ✓</span>}
      {state === 'error' && <span className="status-note status-err">সেভ হয়নি, আবার চেষ্টা করুন</span>}
    </span>
  );
}
