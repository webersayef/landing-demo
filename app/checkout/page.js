import { redirect } from 'next/navigation';

// Phase 4.1: the checkout form now lives at the bottom of the
// (single-page) landing page. Keep old /checkout links working
// by sending them to the form's anchor on the home page.
export default function CheckoutRedirectPage() {
  redirect('/#checkout');
}
