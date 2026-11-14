import { Header } from '@/components/Header';
import { CartView } from '@/features/cart/CartView';

/** Route /cart (FR-03). */
export default function CartPage() {
  return (
    <>
      <Header active="/cart" />
      <main className="mx-auto max-w-[1440px] px-4 py-8 md:px-10 md:py-12 lg:px-20">
        <CartView />
      </main>
    </>
  );
}
