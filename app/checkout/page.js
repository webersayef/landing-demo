import { getCatalog } from '@/lib/catalog';
import CheckoutForm from './CheckoutForm';

// Prices come from the database (editable in /admin/product), so
// this page renders fresh on every request and hands the data to
// the client form as props.
export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
  const { products, areas } = await getCatalog();
  return <CheckoutForm products={products} areas={areas} />;
}
