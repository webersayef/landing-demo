// Server-side Supabase access via the PostgREST REST API (plain fetch —
// no extra dependency). Uses the service_role key, which bypasses Row
// Level Security, so this module must ONLY ever run on the server
// (API routes / server components) — never import it from client code.
//
// Env vars (read at call time so config changes apply without rebuilds):
//   SUPABASE_URL               e.g. https://xyzcompany.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY  from Supabase → Settings → API

function getConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return { url: url ? url.replace(/\/+$/, '') : '', key: key || '' };
}

export function isSupabaseConfigured() {
  const { url, key } = getConfig();
  return Boolean(url && key);
}

function headers(extra = {}) {
  const { key } = getConfig();
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

// Map the in-app order object (camelCase) to orders-table columns.
function toRow(order) {
  return {
    id: order.id,
    name: order.name,
    phone: order.phone,
    address: order.address,
    product_id: order.productId,
    product_name: order.productName,
    quantity: order.quantity,
    delivery_area: order.areaId,
    subtotal: order.subtotal,
    delivery_charge: order.deliveryCharge,
    total: order.total,
    status: order.status || 'pending',
  };
}

export async function insertOrder(order) {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: 'Supabase is not configured.' };
  }
  const { url } = getConfig();
  try {
    const res = await fetch(`${url}/rest/v1/orders`, {
      method: 'POST',
      headers: headers({ Prefer: 'return=minimal' }),
      body: JSON.stringify(toRow(order)),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, error: `Supabase insert failed (${res.status}): ${text}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: `Supabase insert error: ${err.message}` };
  }
}

export async function listOrders() {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: 'Supabase is not configured.', data: [] };
  }
  const { url } = getConfig();
  try {
    const res = await fetch(
      `${url}/rest/v1/orders?select=*&order=created_at.desc&limit=200`,
      { headers: headers(), cache: 'no-store' }
    );
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, error: `Supabase list failed (${res.status}): ${text}`, data: [] };
    }
    const data = await res.json();
    return { ok: true, data: Array.isArray(data) ? data : [] };
  } catch (err) {
    return { ok: false, error: `Supabase list error: ${err.message}`, data: [] };
  }
}

export async function updateOrderStatus(id, status) {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: 'Supabase is not configured.' };
  }
  const { url } = getConfig();
  try {
    const res = await fetch(
      `${url}/rest/v1/orders?id=eq.${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        headers: headers({ Prefer: 'return=minimal' }),
        body: JSON.stringify({ status }),
      }
    );
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, error: `Supabase update failed (${res.status}): ${text}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: `Supabase update error: ${err.message}` };
  }
}

// ── Site settings (Phase 3: product & prices editable in /admin) ──
// Single-row table public.site_settings (id = 1), created by
// supabase-products.sql. Reads return null when the table/row does
// not exist yet — callers then fall back to lib/products.js defaults.

export async function getSiteSettings() {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: 'Supabase is not configured.', data: null };
  }
  const { url } = getConfig();
  try {
    const res = await fetch(
      `${url}/rest/v1/site_settings?select=*&id=eq.1`,
      { headers: headers(), cache: 'no-store' }
    );
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, error: `Supabase settings failed (${res.status}): ${text}`, data: null };
    }
    const rows = await res.json();
    const row = Array.isArray(rows) && rows.length ? rows[0] : null;
    return { ok: true, data: row };
  } catch (err) {
    return { ok: false, error: `Supabase settings error: ${err.message}`, data: null };
  }
}

// Upsert (insert-or-update) the single settings row — works even if
// the seed insert from the SQL file has not run yet.
export async function saveSiteSettings(fields) {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: 'Supabase is not configured.' };
  }
  const { url } = getConfig();
  try {
    const res = await fetch(`${url}/rest/v1/site_settings`, {
      method: 'POST',
      headers: headers({
        Prefer: 'resolution=merge-duplicates,return=minimal',
      }),
      body: JSON.stringify({ id: 1, ...fields, updated_at: new Date().toISOString() }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, error: `Supabase settings save failed (${res.status}): ${text}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: `Supabase settings save error: ${err.message}` };
  }
}
