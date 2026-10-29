import crypto from 'node:crypto';
import { cookies } from 'next/headers';

// Admin session auth: a single shared password (env ADMIN_PASSWORD).
// The session cookie holds an HMAC of a fixed string keyed by that
// password — the password itself never goes into the cookie, and
// changing ADMIN_PASSWORD invalidates all existing sessions.

export const ADMIN_COOKIE = 'admin_session';
const SESSION_MESSAGE = 'shera-admin-session';

export function getSessionToken() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  return crypto
    .createHmac('sha256', password)
    .update(SESSION_MESSAGE)
    .digest('hex');
}

export async function isAdminAuthed() {
  const token = getSessionToken();
  if (!token) return false;
  const cookieStore = await cookies();
  const value = cookieStore.get(ADMIN_COOKIE)?.value || '';
  if (value.length !== token.length) return false;
  return crypto.timingSafeEqual(Buffer.from(value), Buffer.from(token));
}
