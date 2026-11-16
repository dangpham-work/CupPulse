'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { CartProvider } from '@/features/cart/CartProvider';
import { retryDelay, shouldRetry } from '@/lib/queryRetry';

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: shouldRetry, retryDelay } } }),
  );
  return (
    <QueryClientProvider client={client}>
      <AuthProvider>
        <CartProvider>{children}</CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
