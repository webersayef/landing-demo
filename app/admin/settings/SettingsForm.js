'use client';

import { useState } from 'react';

// Delivery-charge settings (Phase 4 split: products now live at
// /admin/products; this page only edits delivery charges). The
// legacy product fields from the settings row are carried along
// unchanged in the payload, because /api/admin/product validates
// the whole row — they are no longer shown or used for pricing.
export default function SettingsForm({ initial }) {
  const [inside, setInside] = useState(initial.deliveryInside);
  const [outside, setOutside] = useState(initial.deliveryOutside);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch('/api/admin/product', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basicName: initial.basicName,
          basicPrice: Number(initial.basicPrice),
          basicRegularPrice: Number(initial.basicRegularPrice),
          proName: initial.proName,
          proPrice: Number(initial.proPrice),
          proRegularPrice: Number(initial.proRegularPrice),
          deliveryInside: Number(inside),
          deliveryOutside: Number(outside),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'save failed');
      }
      setMessage('সেভ হয়েছে ✅ — নতুন ডেলিভারি চার্জ এখনই কার্যকর।');
    } catch (err) {
      setError(
        err.message === 'save failed'
          ? 'সেভ করা যায়নি, আবার চেষ্টা করুন।'
          : err.message
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="settings-group">
        <h2>ডেলিভারি চার্জ</h2>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="deliveryInside">ঢাকার ভিতরে (৳)</label>
            <input
              id="deliveryInside"
              type="number"
              min="0"
              step="1"
              value={inside}
              onChange={(e) => setInside(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="deliveryOutside">ঢাকার বাইরে (৳)</label>
            <input
              id="deliveryOutside"
              type="number"
              min="0"
              step="1"
              value={outside}
              onChange={(e) => setOutside(e.target.value)}
              required
            />
          </div>
        </div>
        <p className="settings-note">
          প্রোডাক্টের নাম ও দাম এখন <strong>প্রোডাক্ট</strong> মেনু থেকে
          বদলানো যায়।
        </p>
      </div>

      {error && <div className="form-error">{error}</div>}
      {message && <div className="save-ok">{message}</div>}

      <button type="submit" className="cta-btn settings-save" disabled={saving}>
        {saving ? 'সেভ হচ্ছে…' : 'সেভ করুন'}
      </button>
    </form>
  );
}
