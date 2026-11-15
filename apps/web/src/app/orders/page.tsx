import { Header } from '@/components/Header';
import { OrderHistoryView } from '@/features/orders/OrderHistoryView';

/** Route /orders (FR-08). */
export default function OrdersPage() {
  return (
    <>
      <Header active="/orders" />
      <main className="mx-auto max-w-[1440px] px-4 py-8 md:px-10 md:py-12 lg:px-20">
        <OrderHistoryView />
      </main>
    </>
  );
}
