'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

// Shared add/edit product form for /admin/products.
// `initial` null → Add New Product (POST); otherwise edit (PATCH).
export default function ProductForm({ initial }) {
  const router = useRouter();
  const [values, setValues] = useState(
    initial || {
      name: '',
      subtitle: '',
      price: '',
      regularPrice: '',
      image: '',
      active: true,
      sort: 0,
    }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  // Upload the chosen file to /api/admin/upload and fill the
  // image URL field with the returned public URL (Phase 5).
  async function handleFile(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok || !data.url) {
        throw new Error(data.error || 'upload failed');
      }
      setValues((prev) => ({ ...prev, image: data.url }));
    } catch (err) {
      setError(
        err.message === 'upload failed'
          ? 'ছবি আপলোড করা যায়নি, আবার চেষ্টা করুন।'
          : err.message
      );
    } finally {
      setUploading(false);
    }
  }

  function set(field) {
    return (e) => {
      const v =
        field === 'active' ? e.target.checked : e.target.value;
      setValues((prev) => ({ ...prev, [field]: v }));
      setError('');
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      ...(initial ? { id: initial.id } : {}),
      name: values.name,
      subtitle: values.subtitle,
      price: Number(values.price),
      regularPrice: Number(values.regularPrice || 0),
      image: values.image,
      active: values.active,
      sort: Number(values.sort || 0),
    };
    try {
      const res = await fetch('/api/admin/products', {
        method: initial ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'save failed');
      }
      router.push('/admin/products');
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
        <div className="field">
          <label htmlFor="pname">প্রোডাক্টের নাম</label>
          <input
            id="pname"
            type="text"
            placeholder="যেমন: SoundPro X9 — বেসিক এডিশন"
            value={values.name}
            onChange={set('name')}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="psubtitle">ছোট বিবরণ (সাবটাইটেল)</label>
          <input
            id="psubtitle"
            type="text"
            placeholder="যেমন: SoundPro X9 ওয়্যারলেস হেডফোন"
            value={values.subtitle}
            onChange={set('subtitle')}
          />
        </div>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="pprice">অফার প্রাইস (৳)</label>
            <input
              id="pprice"
              type="number"
              min="1"
              step="1"
              value={values.price}
              onChange={set('price')}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="pregular">রেগুলার প্রাইস (৳)</label>
            <input
              id="pregular"
              type="number"
              min="0"
              step="1"
              value={values.regularPrice}
              onChange={set('regularPrice')}
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="pimage">ছবির ঠিকানা (URL বা /images/...)</label>
          <input
            id="pimage"
            type="text"
            placeholder="খালি রাখলে ছবি দেখাবে না"
            value={values.image}
            onChange={set('image')}
          />
          <div className="upload-row">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              hidden
              onChange={handleFile}
            />
            <button
              type="button"
              className="edit-btn"
              disabled={uploading}
              onClick={() => fileRef.current && fileRef.current.click()}
            >
              {uploading ? 'আপলোড হচ্ছে…' : '📷 ছবি আপলোড করুন'}
            </button>
            <span className="settings-note">সর্বোচ্চ ৪ MB — JPG, PNG, WebP বা GIF</span>
          </div>
          {values.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={values.image} alt="" className="thumb-preview" />
          ) : null}
        </div>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="psort">সাজানোর ক্রম (ছোট সংখ্যা আগে)</label>
            <input
              id="psort"
              type="number"
              step="1"
              value={values.sort}
              onChange={set('sort')}
            />
          </div>
          <label className="check-row">
            <input
              type="checkbox"
              checked={values.active}
              onChange={set('active')}
            />
            সক্রিয় (সাইটে বিক্রির জন্য দেখাবে)
          </label>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      <button type="submit" className="cta-btn settings-save" disabled={saving}>
        {saving
          ? 'সেভ হচ্ছে…'
          : initial
            ? 'পরিবর্তন সেভ করুন'
            : 'প্রোডাক্ট যোগ করুন'}
      </button>
    </form>
  );
}
