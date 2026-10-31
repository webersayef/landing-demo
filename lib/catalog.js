// Server-side catalog: the product/price data the site actually uses.
//
// Product source, in order:
//   1) public.products table (Phase 4 — managed at /admin/products);
//      only ACTIVE products are sold, ordered by `sort`.
//   2) the Phase 3 site_settings row (basic/pro fallback);
//   3) the static defaults in lib/products.js.
// Delivery charges always come from site_settings (fallback: static).
// Any failure silently falls back — the site never breaks.
//
// SERVER ONLY: imports lib/supabase.js (service_role key).

import { PRODUCTS, DELIVERY_AREAS } from './products';
import {
  getSiteSettings,
  listProductRows,
  getPageBySlug,
  getPageProducts,
} from './supabase';

function fromSettingsRow(data) {
  return [
    {
      id: 'basic',
      name: String(data.basic_name || PRODUCTS[0].name),
      subtitle: PRODUCTS[0].subtitle || '',
      price: Number(data.basic_price) || PRODUCTS[0].price,
      regularPrice: Number(data.basic_regular_price) || PRODUCTS[0].regularPrice,
      image: '',
    },
    {
      id: 'pro',
      name: String(data.pro_name || PRODUCTS[1].name),
      subtitle: PRODUCTS[1].subtitle || '',
      price: Number(data.pro_price) || PRODUCTS[1].price,
      regularPrice: Number(data.pro_regular_price) || PRODUCTS[1].regularPrice,
      image: '',
    },
  ];
}

export async function getCatalog() {
  let products = null;
  let areas = DELIVERY_AREAS;
  let fromDb = false;

  // Delivery charges (+ legacy product fallback) from site_settings.
  let settings = null;
  try {
    const s = await getSiteSettings();
    if (s.ok && s.data) {
      settings = s.data;
      areas = [
        { id: 'inside', label: DELIVERY_AREAS[0].label, charge: Number(settings.delivery_inside) || DELIVERY_AREAS[0].charge },
        { id: 'outside', label: DELIVERY_AREAS[1].label, charge: Number(settings.delivery_outside) || DELIVERY_AREAS[1].charge },
      ];
      fromDb = true;
    }
  } catch {
    // keep static fallbacks
  }

  // Products from the products table (active only).
  try {
    const p = await listProductRows();
    if (p.ok && p.data.length) {
      const active = p.data.filter((r) => r.active !== false);
      if (active.length) {
        products = active.map((r) => ({
          id: String(r.id),
          name: String(r.name),
          subtitle: String(r.subtitle || ''),
          price: Number(r.price) || 0,
          regularPrice: Number(r.regular_price) || 0,
          image: String(r.image || ''),
        }));
        fromDb = true;
      }
    }
  } catch {
    // fall through to settings/static
  }

  if (!products) {
    products = settings ? fromSettingsRow(settings) : PRODUCTS;
  }

  return { products, areas, fromDb };
}

export function findProduct(catalog, id) {
  return catalog.products.find((p) => p.id === id) || null;
}

export function findArea(catalog, id) {
  return catalog.areas.find((a) => a.id === id) || null;
}

// ── Landing pages (Phase 5) ─────────────────────────────────
// Catalog for one /lp/[slug] page. Returns null when the page
// does not exist, is inactive, or the Phase 5 tables are not
// there yet — the route turns that into a 404. Delivery charges
// come from the page's own override when set, otherwise the
// site_settings chain (fallback: static defaults), exactly like
// the homepage. Products are the page's ACTIVE products in the
// page's own sort order.
export async function getPageCatalog(slug) {
  let pageRes;
  try {
    pageRes = await getPageBySlug(String(slug || ''));
  } catch {
    return null;
  }
  if (!pageRes.ok || !pageRes.data || pageRes.data.active === false) {
    return null;
  }
  const row = pageRes.data;

  // Delivery: settings chain first (same fallback as homepage)…
  let inside = DELIVERY_AREAS[0].charge;
  let outside = DELIVERY_AREAS[1].charge;
  try {
    const s = await getSiteSettings();
    if (s.ok && s.data) {
      inside = Number(s.data.delivery_inside) || inside;
      outside = Number(s.data.delivery_outside) || outside;
    }
  } catch {
    // keep static fallbacks
  }
  // …then the page's own charges win when filled in (0 = free).
  if (row.delivery_inside !== null && row.delivery_inside !== undefined && row.delivery_inside !== '') {
    const n = Number(row.delivery_inside);
    if (Number.isFinite(n)) inside = n;
  }
  if (row.delivery_outside !== null && row.delivery_outside !== undefined && row.delivery_outside !== '') {
    const n = Number(row.delivery_outside);
    if (Number.isFinite(n)) outside = n;
  }

  let products = [];
  try {
    const joined = await getPageProducts(row.id);
    if (joined.ok) {
      products = joined.data
        .filter((r) => r.active !== false)
        .map((r) => ({
          id: String(r.id),
          name: String(r.name),
          subtitle: String(r.subtitle || ''),
          price: Number(r.price) || 0,
          regularPrice: Number(r.regular_price) || 0,
          image: String(r.image || ''),
        }));
    }
  } catch {
    // page renders with no products rather than breaking
  }

  const areas = [
    { id: 'inside', label: DELIVERY_AREAS[0].label, charge: inside },
    { id: 'outside', label: DELIVERY_AREAS[1].label, charge: outside },
  ];

  return {
    page: {
      id: String(row.id),
      name: String(row.name || ''),
      slug: String(row.slug || ''),
      headline: String(row.headline || ''),
      description: String(row.description || ''),
      selectionMode: row.selection_mode === 'multi' ? 'multi' : 'single',
      pixelId: String(row.pixel_id || ''),
    },
    products,
    areas,
    deliveryInside: inside,
    deliveryOutside: outside,
  };
}
