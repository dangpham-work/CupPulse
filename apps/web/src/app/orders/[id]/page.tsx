import { Header } from '@/components/Header';
import { OrderDetailView } from '@/features/orders/OrderDetailView';

/** Route /orders/:id (FR-07). */
export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <Header active="/orders" />
      <main className="mx-auto max-w-[1440px] px-4 py-8 md:px-10 md:py-12 lg:px-20">
        <OrderDetailView id={id} />
      </main>
    </>
  );
}
