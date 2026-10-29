'use client';

import { useState } from 'react';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        window.location.href = '/admin';
        return;
      }
      setError(data.error || 'লগইন করা যায়নি। আবার চেষ্টা করুন।');
    } catch {
      setError('সার্ভারে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    }
    setBusy(false);
  }

  return (
    <main className="admin-wrap">
      <div className="admin-login-card">
        <h1>অ্যাডমিন লগইন</h1>
        <p className="admin-login-sub">অর্ডার দেখতে পাসওয়ার্ড দিয়ে লগইন করুন।</p>
        <form onSubmit={onSubmit} className="form-grid">
          <div className="field">
            <label htmlFor="admin-password">পাসওয়ার্ড</label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          {error && <div className="form-error">{error}</div>}
          <button type="submit" className="cta-btn submit-btn" disabled={busy}>
            {busy ? 'লগইন হচ্ছে…' : 'লগইন করুন'}
          </button>
        </form>
      </div>
    </main>
  );
}
