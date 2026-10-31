'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Shared create/edit form for /admin/pages (Phase 5).
// `initial` null → new page (POST); otherwise edit (PATCH).
// `products` = every product (active + inactive) for the picker;
// `initial.selected` = { [productId]: sort } for pre-ticked items.
export default function PageForm({ initial, products }) {
  const router = useRouter();
  const [values, setValues] = useState(
    initial || {
      name: '',
      slug: '',
      headline: '',
      description: '',
      selectionMode: 'single',
      deliveryInside: '',
      deliveryOutside: '',
      pixelId: '',
      active: true,
    }
  );
  const [picked, setPicked] = useState(() => {
    const map = {};
    if (initial && initial.selected) {
      for (const [id, sort] of Object.entries(initial.selected)) {
        map[id] = { checked: true, sort: String(sort) };
      }
    }
    return map;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function set(field) {
    return (e) => {
      const v = field === 'active' ? e.target.checked : e.target.value;
      setValues((prev) => ({ ...prev, [field]: v }));
      setError('');
    };
  }

  function togglePick(id, checked) {
    setPicked((prev) => ({
      ...prev,
      [id]: { checked, sort: prev[id] ? prev[id].sort : '0' },
    }));
    setError('');
  }

  function setPickSort(id, sort) {
    setPicked((prev) => ({
      ...prev,
      [id]: { checked: prev[id] ? prev[id].checked : false, sort },
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!SLUG_RE.test(values.slug.trim())) {
      setError('স্লাগে শুধু ছোট হাতের ইংরেজি অক্ষর, সংখ্যা ও হাইফেন (-) চলবে — যেমন: headphone-offer');
      return;
    }
    setSaving(true);
    setError('');
    const productSet = Object.entries(picked)
      .filter(([, v]) => v.checked)
      .map(([product_id, v]) => ({
        product_id,
        sort: Number(v.sort) || 0,
      }));
    const payload = {
      ...(initial ? { id: initial.id } : {}),
      name: values.name,
      slug: values.slug.trim(),
      headline: values.headline,
      description: values.description,
      selectionMode: values.selectionMode,
      deliveryInside: values.deliveryInside,
      deliveryOutside: values.deliveryOutside,
      pixelId: values.pixelId,
      active: values.active,
      productSet,
    };
    try {
      const res = await fetch('/api/admin/pages', {
        method: initial ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'save failed');
      }
      router.push('/admin/pages');
      router.refresh();
    } catch (err) {
      setError(
        err.message === 'save failed'
          ? 'সেভ করা যায়নি, আবার চেষ্টা করুন।'
          : err.message
      );
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="settings-group">
        <div className="form-grid">
          <div className="field">
            <label htmlFor="pgname">পেজের নাম</label>
            <input
              id="pgname"
              type="text"
              placeholder="যেমন: SoundPro X9 অফার"
              value={values.name}
              onChange={set('name')}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="pgslug">স্লাগ (পেজের ঠিকানা)</label>
            <input
              id="pgslug"
              type="text"
              placeholder="যেমন: soundpro-x9"
              value={values.slug}
              onChange={set('slug')}
              required
            />
            <span className="settings-note">
              পেজটি দেখা যাবে এই ঠিকানায়: /lp/{values.slug || '...'}
            </span>
          </div>
        </div>
        <div className="field">
          <label htmlFor="pgheadline">হেডলাইন (বড় হুক লাইন)</label>
          <input
            id="pgheadline"
            type="text"
            placeholder="যেমন: একবার চার্জে ৪০ ঘণ্টা!"
            value={values.headline}
            onChange={set('headline')}
          />
        </div>
        <div className="field">
          <label htmlFor="pgdesc">বিবরণ (ছোট প্যারাগ্রাফ)</label>
          <textarea
            id="pgdesc"
            rows={3}
            placeholder="পেজের হেডলাইনের নিচে যে লেখাটি দেখাবে"
            value={values.description}
            onChange={set('description')}
          />
        </div>
      </div>

      <div className="settings-group">
        <h2>প্রোডাক্ট বাছাই</h2>
        <p className="settings-note">
          যেসব প্রোডাক্ট এই পেজে বিক্রি হবে সেগুলোতে টিক দিন। "ক্রম" হলো
          পেজে দেখানোর সাজানো — ছোট সংখ্যা আগে দেখাবে।
        </p>
        {products.length === 0 ? (
          <p className="admin-empty">এখনো কোনো প্রোডাক্ট নেই — আগে প্রোডাক্ট যোগ করুন।</p>
        ) : (
          products.map((p) => {
            const pick = picked[p.id] || { checked: false, sort: '0' };
            return (
              <div key={p.id} className="picker-row">
                <label className="picker-main">
                  <input
                    type="checkbox"
                    checked={pick.checked}
                    onChange={(e) => togglePick(p.id, e.target.checked)}
                  />
                  <span>
                    <strong>{p.name}</strong>
                    {p.active === false ? (
                      <span className="active-badge off">বন্ধ</span>
                    ) : null}
                  </span>
                </label>
                <label className="picker-sort">
                  ক্রম
                  <input
                    type="number"
                    step="1"
                    value={pick.sort}
                    disabled={!pick.checked}
                    onChange={(e) => setPickSort(p.id, e.target.value)}
                  />
                </label>
              </div>
            );
          })
        )}

        <div className="field">
          <label>কাস্টমার সিলেকশন</label>
          <label className="check-row">
            <input
              type="radio"
              name="selmode"
              checked={values.selectionMode === 'single'}
              onChange={() => {
                setValues((prev) => ({ ...prev, selectionMode: 'single' }));
                setError('');
              }}
            />
            একটাই সিলেক্ট হবে (একবারে একটি প্রোডাক্ট)
          </label>
          <label className="check-row">
            <input
              type="radio"
              name="selmode"
              checked={values.selectionMode === 'multi'}
              onChange={() => {
                setValues((prev) => ({ ...prev, selectionMode: 'multi' }));
                setError('');
              }}
            />
            একাধিক একসাথে নেওয়া যাবে (কয়েকটি প্রোডাক্ট এক অর্ডারে)
          </label>
        </div>
      </div>

      <div className="settings-group">
        <h2>ডেলিভারি চার্জ ও পিক্সেল</h2>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="pgdin">ঢাকার ভিতরে চার্জ (৳)</label>
            <input
              id="pgdin"
              type="number"
              min="0"
              step="1"
              placeholder="খালি = সাধারণ চার্জ"
              value={values.deliveryInside}
              onChange={set('deliveryInside')}
            />
          </div>
          <div className="field">
            <label htmlFor="pgdout">ঢাকার বাইরে চার্জ (৳)</label>
            <input
              id="pgdout"
              type="number"
              min="0"
              step="1"
              placeholder="খালি = সাধারণ চার্জ"
              value={values.deliveryOutside}
              onChange={set('deliveryOutside')}
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="pgpixel">Facebook Pixel ID</label>
          <input
            id="pgpixel"
            type="text"
            placeholder="খালি রাখলে এই পেজে পিক্সেল চলবে না"
            value={values.pixelId}
            onChange={set('pixelId')}
          />
        </div>
        <label className="check-row">
          <input
            type="checkbox"
            checked={values.active}
            onChange={set('active')}
          />
          সক্রিয় (বন্ধ থাকলে পেজটি খুলবে না)
        </label>
      </div>

      {error && <div className="form-error">{error}</div>}

      <button type="submit" className="cta-btn settings-save" disabled={saving}>
        {saving
          ? 'সেভ হচ্ছে…'
          : initial
            ? 'পরিবর্তন সেভ করুন'
            : 'ল্যান্ডিং পেজ তৈরি করুন'}
      </button>
    </form>
  );
}
