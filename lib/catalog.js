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
import { getSiteSettings, listProductRows } from './supabase';

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
