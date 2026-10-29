// Single source of truth for prices — used by BOTH the checkout page
// (client) and the /api/order route (server), so totals always match.
export const PRODUCTS = [
  {
    id: 'basic',
    name: 'SoundPro X9 — বেসিক এডিশন',
    price: 1250,
    regularPrice: 1800,
  },
  {
    id: 'pro',
    name: 'SoundPro X9 — প্রো এডিশন',
    price: 1850,
    regularPrice: 2600,
  },
];

export const DELIVERY_AREAS = [
  { id: 'inside', label: 'ঢাকার ভিতরে', charge: 60 },
  { id: 'outside', label: 'ঢাকার বাইরে', charge: 120 },
];

export function getProduct(id) {
  return PRODUCTS.find((p) => p.id === id) || null;
}

export function getDeliveryArea(id) {
  return DELIVERY_AREAS.find((a) => a.id === id) || null;
}

// Bangladeshi mobile: 11 digits, starts with 01, third digit 3–9.
export function isValidBdPhone(phone) {
  return /^01[3-9]\d{8}$/.test(String(phone || '').trim());
}

export function formatBDT(amount) {
  return '৳' + Number(amount || 0).toLocaleString('en-IN');
}
