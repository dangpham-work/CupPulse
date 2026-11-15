'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { formatVnd, type OrderPage } from '@brewlite/shared';
import { useAuth } from '@/features/auth/AuthProvider';
import { formatTime, STATUS_LABEL } from './labels';

const LIMIT = 10;

/** Lịch sử đơn của chính người dùng, mới nhất trước (FR-08). */
export function OrderHistoryView() {
  const auth = useAuth();
  const router = useRouter();
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (auth.ready && !auth.user) router.replace(`/login?returnUrl=${encodeURIComponent('/orders')}`);
  }, [auth.ready, auth.user, router]);

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['orders', page],
    enabled: auth.ready && !!auth.user,
    queryFn: async () => (await auth.request<OrderPage>(`/orders?page=${page}&limit=${LIMIT}`)).data,
  });

  if (!auth.ready || isPending) return <div aria-busy="true" aria-label="Đang tải đơn" className="mx-auto h-48 max-w-2xl animate-pulse rounded-2xl bg-line" />;
  if (isError || !data) {
    return (
      <div role="alert" className="mx-auto max-w-md rounded-2xl border border-line bg-white p-6 text-center">
        <p className="font-medium">Không tải được lịch sử đơn.</p>
        <button type="button" onClick={() => void refetch()} className="mt-4 min-h-11 rounded-[10px] bg-brand px-6 text-sm font-semibold text-white">Thử lại</button>
      </div>
    );
  }
  if (data.total === 0) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-line bg-white p-8 text-center">
        <p className="text-lg font-semibold text-ink">Bạn chưa có đơn nào</p>
        <Link href="/menu" className="mt-4 inline-flex min-h-11 items-center rounded-[10px] bg-brand px-6 text-sm font-semibold text-white">Xem menu</Link>
      </div>
    );
  }

  const pages = Math.max(1, Math.ceil(data.total / data.limit));
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <h1 className="text-[28px] font-bold text-ink">Đơn hàng của tôi</h1>
      <ul className="flex flex-col gap-3">
        {data.items.map((o) => (
          <li key={o.id}>
            <Link href={`/orders/${o.id}`} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white p-4 hover:border-brand">
              <div>
                <p className="font-semibold text-ink">{o.code}</p>
                <p className="text-[13px] text-muted">{formatTime(o.createdAt)} · {o.cups} ly</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-brand">{formatVnd(o.total)}</p>
                <p className="text-[13px] text-muted">{STATUS_LABEL[o.status]}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => setPage((p) => p - 1)} disabled={page <= 1} className="min-h-11 rounded-[10px] border border-line px-4 text-sm font-semibold text-brand disabled:opacity-40">Trang trước</button>
        <span className="text-sm text-muted">Trang {page}/{pages}</span>
        <button type="button" onClick={() => setPage((p) => p + 1)} disabled={page >= pages} className="min-h-11 rounded-[10px] border border-line px-4 text-sm font-semibold text-brand disabled:opacity-40">Trang sau</button>
      </div>
    </div>
  );
}
