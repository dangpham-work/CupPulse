import { Suspense } from 'react';
import { Header } from '@/components/Header';
import { RegisterView } from '@/features/auth/RegisterView';

/** Route /register. */
export default function Page() {
  return (
    <>
      <Header active="/register" />
      <main className="mx-auto max-w-[1440px] px-4 py-8 md:px-10 md:py-12 lg:px-20">
        <Suspense>
          <RegisterView />
        </Suspense>
      </main>
    </>
  );
}
