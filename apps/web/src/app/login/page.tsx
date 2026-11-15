import { Suspense } from 'react';
import { Header } from '@/components/Header';
import { LoginView } from '@/features/auth/LoginView';

/** Route /login. */
export default function Page() {
  return (
    <>
      <Header active="/login" />
      <main className="mx-auto max-w-[1440px] px-4 py-8 md:px-10 md:py-12 lg:px-20">
        <Suspense>
          <LoginView />
        </Suspense>
      </main>
    </>
  );
}
