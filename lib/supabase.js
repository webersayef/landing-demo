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
function toRow(order, includePhase5 = true) {
  const row = {
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
  // Phase 5 columns (items jsonb, page_slug) only exist after
  // supabase-phase5.sql has run — see the retry in insertOrder.
  if (includePhase5) {
    row.items = Array.isArray(order.items) ? order.items : null;
    row.page_slug = order.pageSlug || null;
  }
  return row;
}

async function postOrderRow(url, row) {
  const res = await fetch(`${url}/rest/v1/orders`, {
    method: 'POST',
    headers: headers({ Prefer: 'return=minimal' }),
    body: JSON.stringify(row),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return { ok: false, error: `Supabase insert failed (${res.status}): ${text}` };
  }
  return { ok: true };
}

export async function insertOrder(order) {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: 'Supabase is not configured.' };
  }
  const { url } = getConfig();
  try {
    const first = await postOrderRow(url, toRow(order, true));
    if (first.ok) return first;
    // The Phase 5 columns may not exist yet (SQL not run) — retry
    // with the legacy columns only, so orders keep saving exactly
    // as they did before Phase 5.
    const retry = await postOrderRow(url, toRow(order, false));
    return retry.ok ? retry : first;
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

// ── Products (Phase 4: real multi-product CRUD) ─────────────
// Table public.products, created by supabase-products-table.sql.
// Reads return ok:false when the table does not exist yet so
// callers can fall back to the Phase 3 settings/static prices.

const PRODUCT_COLS = 'id,name,subtitle,price,regular_price,image,active,sort,created_at';

export async function listProductRows() {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: 'Supabase is not configured.', data: [] };
  }
  const { url } = getConfig();
  try {
    const res = await fetch(
      `${url}/rest/v1/products?select=${PRODUCT_COLS}&order=sort.asc,created_at.asc`,
      { headers: headers(), cache: 'no-store' }
    );
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, error: `Supabase products failed (${res.status}): ${text}`, data: [] };
    }
    const data = await res.json();
    return { ok: true, data: Array.isArray(data) ? data : [] };
  } catch (err) {
    return { ok: false, error: `Supabase products error: ${err.message}`, data: [] };
  }
}

export async function getProductRow(id) {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: 'Supabase is not configured.', data: null };
  }
  const { url } = getConfig();
  try {
    const res = await fetch(
      `${url}/rest/v1/products?select=${PRODUCT_COLS}&id=eq.${encodeURIComponent(id)}`,
      { headers: headers(), cache: 'no-store' }
    );
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, error: `Supabase product failed (${res.status}): ${text}`, data: null };
    }
    const rows = await res.json();
    return { ok: true, data: Array.isArray(rows) && rows.length ? rows[0] : null };
  } catch (err) {
    return { ok: false, error: `Supabase product error: ${err.message}`, data: null };
  }
}

export async function createProductRow(row) {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: 'Supabase is not configured.' };
  }
  const { url } = getConfig();
  try {
    const res = await fetch(`${url}/rest/v1/products`, {
      method: 'POST',
      headers: headers({ Prefer: 'return=minimal' }),
      body: JSON.stringify(row),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, error: `Supabase product create failed (${res.status}): ${text}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: `Supabase product create error: ${err.message}` };
  }
}

export async function updateProductRow(id, fields) {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: 'Supabase is not configured.' };
  }
  const { url } = getConfig();
  try {
    const res = await fetch(
      `${url}/rest/v1/products?id=eq.${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        headers: headers({ Prefer: 'return=minimal' }),
        body: JSON.stringify(fields),
      }
    );
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, error: `Supabase product update failed (${res.status}): ${text}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: `Supabase product update error: ${err.message}` };
  }
}

export async function deleteProductRow(id) {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: 'Supabase is not configured.' };
  }
  const { url } = getConfig();
  try {
    const res = await fetch(
      `${url}/rest/v1/products?id=eq.${encodeURIComponent(id)}`,
      { method: 'DELETE', headers: headers({ Prefer: 'return=minimal' }) }
    );
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, error: `Supabase product delete failed (${res.status}): ${text}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: `Supabase product delete error: ${err.message}` };
  }
}

// ── Landing pages (Phase 5) ─────────────────────────────────
// Tables public.landing_pages + public.landing_page_products,
// created by supabase-phase5.sql. Every helper fails soft
// ({ ok:false }) when the tables do not exist yet, so the
// homepage and the older admin pages keep working before the
// SQL has been run.

const PAGE_COLS =
  'id,created_at,name,slug,headline,description,selection_mode,delivery_inside,delivery_outside,pixel_id,active';

async function fetchRows(path) {
  const { url } = getConfig();
  const res = await fetch(`${url}/rest/v1/${path}`, {
    headers: headers(),
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Supabase request failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function listPages() {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: 'Supabase is not configured.', data: [] };
  }
  try {
    const data = await fetchRows(
      `landing_pages?select=${PAGE_COLS}&order=created_at.asc`
    );
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err.message, data: [] };
  }
}

async function getOnePage(query) {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: 'Supabase is not configured.', data: null };
  }
  try {
    const rows = await fetchRows(`landing_pages?select=${PAGE_COLS}&${query}`);
    return { ok: true, data: rows.length ? rows[0] : null };
  } catch (err) {
    return { ok: false, error: err.message, data: null };
  }
}

export async function getPageById(id) {
  return getOnePage(`id=eq.${encodeURIComponent(id)}`);
}

export async function getPageBySlug(slug) {
  return getOnePage(`slug=eq.${encodeURIComponent(slug)}`);
}

export async function createPageRow(row) {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: 'Supabase is not configured.' };
  }
  const { url } = getConfig();
  try {
    const res = await fetch(`${url}/rest/v1/landing_pages`, {
      method: 'POST',
      headers: headers({ Prefer: 'return=minimal' }),
      body: JSON.stringify(row),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, error: `Supabase page create failed (${res.status}): ${text}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: `Supabase page create error: ${err.message}` };
  }
}

export async function updatePageRow(id, fields) {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: 'Supabase is not configured.' };
  }
  const { url } = getConfig();
  try {
    const res = await fetch(
      `${url}/rest/v1/landing_pages?id=eq.${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        headers: headers({ Prefer: 'return=minimal' }),
        body: JSON.stringify(fields),
      }
    );
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, error: `Supabase page update failed (${res.status}): ${text}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: `Supabase page update error: ${err.message}` };
  }
}

export async function deletePageRow(id) {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: 'Supabase is not configured.' };
  }
  const { url } = getConfig();
  try {
    const res = await fetch(
      `${url}/rest/v1/landing_pages?id=eq.${encodeURIComponent(id)}`,
      { method: 'DELETE', headers: headers({ Prefer: 'return=minimal' }) }
    );
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, error: `Supabase page delete failed (${res.status}): ${text}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: `Supabase page delete error: ${err.message}` };
  }
}

// Raw join rows for a page: [{ product_id, sort }] in sort order.
async function fetchPageJoinRows(pageId) {
  return fetchRows(
    `landing_page_products?select=page_id,product_id,sort&page_id=eq.${encodeURIComponent(pageId)}&order=sort.asc`
  );
}

// Products joined to a page — ACTIVE and INACTIVE products alike,
// each product row carrying its page order as `page_sort`, in
// page order. Used by the storefront catalog (which filters to
// active) and by the admin page editor.
export async function getPageProducts(pageId) {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: 'Supabase is not configured.', data: [] };
  }
  try {
    const joins = await fetchPageJoinRows(pageId);
    if (!joins.length) return { ok: true, data: [] };
    const products = await listProductRows();
    if (!products.ok) {
      return { ok: false, error: products.error, data: [] };
    }
    const byId = new Map(products.data.map((p) => [String(p.id), p]));
    const data = [];
    for (const j of joins) {
      const product = byId.get(String(j.product_id));
      if (product) data.push({ ...product, page_sort: Number(j.sort) || 0 });
    }
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err.message, data: [] };
  }
}

// Replace a page's whole product set (delete all + insert the
// given rows). `list` = [{ product_id, sort }].
export async function setPageProducts(pageId, list) {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: 'Supabase is not configured.' };
  }
  const { url } = getConfig();
  try {
    const del = await fetch(
      `${url}/rest/v1/landing_page_products?page_id=eq.${encodeURIComponent(pageId)}`,
      { method: 'DELETE', headers: headers({ Prefer: 'return=minimal' }) }
    );
    if (!del.ok) {
      const text = await del.text().catch(() => '');
      return { ok: false, error: `Supabase page products clear failed (${del.status}): ${text}` };
    }
    const rows = (Array.isArray(list) ? list : []).map((item) => ({
      page_id: pageId,
      product_id: String(item.product_id),
      sort: Number(item.sort) || 0,
    }));
    if (rows.length) {
      const res = await fetch(`${url}/rest/v1/landing_page_products`, {
        method: 'POST',
        headers: headers({ Prefer: 'return=minimal' }),
        body: JSON.stringify(rows),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        return { ok: false, error: `Supabase page products save failed (${res.status}): ${text}` };
      }
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: `Supabase page products error: ${err.message}` };
  }
}

// Duplicate a page and its product links. The copy gets slug
// "<slug>-copy", then "<slug>-copy-2", "-copy-3", … until free.
export async function duplicatePage(id) {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: 'Supabase is not configured.', data: null };
  }
  const original = await getPageById(id);
  if (!original.ok) return { ok: false, error: original.error, data: null };
  if (!original.data) {
    return { ok: false, error: 'পেজটি পাওয়া যায়নি।', data: null };
  }
  const src = original.data;

  let slug = `${src.slug}-copy`;
  let n = 2;
  // eslint-disable-next-line no-await-in-loop
  while ((await getPageBySlug(slug)).data && n <= 50) {
    slug = `${src.slug}-copy-${n}`;
    n += 1;
  }

  const newId = `lp-${Date.now().toString(36)}`;
  const row = {
    id: newId,
    name: `${src.name} (কপি)`,
    slug,
    headline: src.headline || '',
    description: src.description || '',
    selection_mode: src.selection_mode === 'multi' ? 'multi' : 'single',
    delivery_inside: src.delivery_inside ?? null,
    delivery_outside: src.delivery_outside ?? null,
    pixel_id: src.pixel_id ?? null,
    active: src.active !== false,
  };
  const created = await createPageRow(row);
  if (!created.ok) return { ok: false, error: created.error, data: null };

  try {
    const joins = await fetchPageJoinRows(id);
    if (joins.length) {
      const saved = await setPageProducts(
        newId,
        joins.map((j) => ({ product_id: j.product_id, sort: j.sort }))
      );
      if (!saved.ok) return { ok: false, error: saved.error, data: null };
    }
  } catch (err) {
    return { ok: false, error: err.message, data: null };
  }
  return { ok: true, data: { id: newId, slug } };
}

// ── Storage: image uploads (Phase 5) ────────────────────────
// Uploads to the public "images" bucket via the Storage REST
// API and returns the public URL. Server-side only (service key).
export async function uploadImage(buffer, contentType, ext) {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: 'Supabase is not configured.', url: '' };
  }
  const { url, key } = getConfig();
  const path = `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}.${ext}`;
  try {
    const res = await fetch(`${url}/storage/v1/object/images/${path}`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': contentType,
        'x-upsert': 'false',
      },
      body: buffer,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return {
        ok: false,
        error: `Supabase upload failed (${res.status}): ${text}`,
        url: '',
      };
    }
    return { ok: true, url: `${url}/storage/v1/object/public/images/${path}` };
  } catch (err) {
    return { ok: false, error: `Supabase upload error: ${err.message}`, url: '' };
  }
}
