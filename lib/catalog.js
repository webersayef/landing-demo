// Server-side catalog: the product/price data the site actually uses.
// Values come from the Supabase `site_settings` row (editable in
// /admin/product) and fall back to the static defaults in
// lib/products.js whenever the database is not set up or unreachable
// — the site therefore never breaks, it just uses the old prices.
//
// SERVER ONLY: imports lib/supabase.js (service_role key).

import { PRODUCTS, DELIVERY_AREAS } from './products';
import { getSiteSettings } from './supabase';

export async function getCatalog() {
  const fallback = { products: PRODUCTS, areas: DELIVERY_AREAS, fromDb: false };
  try {
    const { ok, data } = await getSiteSettings();
    if (!ok || !data) return fallback;
    const products = [
      {
        id: 'basic',
        name: String(data.basic_name || PRODUCTS[0].name),
        price: Number(data.basic_price) || PRODUCTS[0].price,
        regularPrice: Number(data.basic_regular_price) || PRODUCTS[0].regularPrice,
      },
      {
        id: 'pro',
        name: String(data.pro_name || PRODUCTS[1].name),
        price: Number(data.pro_price) || PRODUCTS[1].price,
        regularPrice: Number(data.pro_regular_price) || PRODUCTS[1].regularPrice,
      },
    ];
    const areas = [
      { id: 'inside', label: DELIVERY_AREAS[0].label, charge: Number(data.delivery_inside) || DELIVERY_AREAS[0].charge },
      { id: 'outside', label: DELIVERY_AREAS[1].label, charge: Number(data.delivery_outside) || DELIVERY_AREAS[1].charge },
    ];
    return { products, areas, fromDb: true };
  } catch {
    return fallback;
  }
}

export function findProduct(catalog, id) {
  return catalog.products.find((p) => p.id === id) || null;
}

export function findArea(catalog, id) {
  return catalog.areas.find((a) => a.id === id) || null;
}
