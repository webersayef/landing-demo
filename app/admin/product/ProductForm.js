'use client';

import { useState } from 'react';

// Product & price settings form (Phase 3). Initial values come
// from the server page; saving PATCHes /api/admin/product, which
// writes the site_settings row the storefront reads.
export default function ProductForm({ initial }) {
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function set(field) {
    return (e) => {
      setValues((v) => ({ ...v, [field]: e.target.value }));
      setMessage('');
      setError('');
    };
  }

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
          basicName: values.basicName,
          basicPrice: Number(values.basicPrice),
          basicRegularPrice: Number(values.basicRegularPrice),
          proName: values.proName,
          proPrice: Number(values.proPrice),
          proRegularPrice: Number(values.proRegularPrice),
          deliveryInside: Number(values.deliveryInside),
          deliveryOutside: Number(values.deliveryOutside),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'save failed');
      }
      setMessage('সেভ হয়েছে ✅ — লাইভ সাইটে এখনই নতুন দাম দেখা যাবে।');
    } catch (err) {
      setError(err.message === 'save failed' ? 'সেভ করা যায়নি, আবার চেষ্টা করুন।' : err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="settings-group">
        <h2>বেসিক এডিশন</h2>
        <div className="field">
          <label htmlFor="basicName">এডিশনের নাম</label>
          <input
            id="basicName"
            type="text"
            value={values.basicName}
            onChange={set('basicName')}
            required
          />
        </div>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="basicPrice">অফার প্রাইস (৳)</label>
            <input
              id="basicPrice"
              type="number"
              min="1"
              step="1"
              value={values.basicPrice}
              onChange={set('basicPrice')}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="basicRegularPrice">রেগুলার প্রাইস (৳)</label>
            <input
              id="basicRegularPrice"
              type="number"
              min="0"
              step="1"
              value={values.basicRegularPrice}
              onChange={set('basicRegularPrice')}
              required
            />
          </div>
        </div>
      </div>

      <div className="settings-group">
        <h2>প্রো এডিশন</h2>
        <div className="field">
          <label htmlFor="proName">এডিশনের নাম</label>
          <input
            id="proName"
            type="text"
            value={values.proName}
            onChange={set('proName')}
            required
          />
        </div>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="proPrice">অফার প্রাইস (৳)</label>
            <input
              id="proPrice"
              type="number"
              min="1"
              step="1"
              value={values.proPrice}
              onChange={set('proPrice')}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="proRegularPrice">রেগুলার প্রাইস (৳)</label>
            <input
              id="proRegularPrice"
              type="number"
              min="0"
              step="1"
              value={values.proRegularPrice}
              onChange={set('proRegularPrice')}
              required
            />
          </div>
        </div>
      </div>

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
              value={values.deliveryInside}
              onChange={set('deliveryInside')}
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
              value={values.deliveryOutside}
              onChange={set('deliveryOutside')}
              required
            />
          </div>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}
      {message && <div className="save-ok">{message}</div>}

      <button type="submit" className="cta-btn settings-save" disabled={saving}>
        {saving ? 'সেভ হচ্ছে…' : 'সেভ করুন'}
      </button>
    </form>
  );
}
