'use client';

export default function LogoutButton() {
  async function onLogout() {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch {
      // Even if the request fails, send the user to the login page.
    }
    window.location.href = '/admin/login';
  }

  return (
    <button type="button" className="admin-logout-btn" onClick={onLogout}>
      লগআউট
    </button>
  );
}
