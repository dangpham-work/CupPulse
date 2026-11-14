'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Header } from '@/components/Header';
import { CheckoutView } from '@/features/checkout/CheckoutView';

function Content() {
  const orderId = useSearchParams().get('orderId') ?? undefined;
  return <CheckoutView orderId={orderId} />;
}

/** Route /checkout (FR-04, FR-05). `?orderId=` để thanh toán tiếp đơn đang chờ. */
export default function CheckoutPage() {
  return (
    <>
      <Header active="/cart" />
      <main className="mx-auto max-w-[1440px] px-4 py-8 md:px-10 md:py-12 lg:px-20">
        <Suspense>
          <Content />
        </Suspense>
      </main>
    </>
  );
}
