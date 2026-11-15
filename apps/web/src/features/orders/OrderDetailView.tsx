'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { formatVnd, type OrderView } from '@brewlite/shared';
import { useAuth } from '@/features/auth/AuthProvider';
import { ApiRequestError } from '@/lib/api';
import { formatTime, isFinal, STATUS_LABEL } from './labels';

/** Xác nhận và theo dõi đơn (FR-07). Polling mỗi 3 s (ADR-007), dừng khi COMPLETED/CANCELLED; react-query tự tạm dừng khi tab ẩn. */
export function OrderDetailView({ id, pollMs = 3000 }: { id: string; pollMs?: number }) {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (auth.ready && !auth.user) router.replace(`/login?returnUrl=${encodeURIComponent(`/orders/${id}`)}`);
  }, [auth.ready, auth.user, id, router]);

  const { data, isPending, error } = useQuery({
    queryKey: ['order', id],
    enabled: auth.ready && !!auth.user,
    queryFn: async () => (await auth.request<OrderView>(`/orders/${id}`)).data,
    refetchInterval: (q) => (isFinal(q.state.data?.status) ? false : pollMs),
  });

  if (!auth.ready || isPending) {
    if (error instanceof ApiRequestError && error.status === 404) return <NotFound />;
    if (!auth.ready || !error) return <div aria-busy="true" aria-label="Đang tải đơn" className="mx-auto h-64 max-w-xl animate-pulse rounded-2xl bg-line" />;
  }
  if (error instanceof ApiRequestError && error.status === 404) return <NotFound />;
  if (!data) {
    return <p role="alert" className="text-center text-muted">Không tải được đơn hàng. Vui lòng thử lại.</p>;
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <div className="rounded-2xl border border-line bg-white p-6 text-center">
        <p className="text-sm text-muted">Số gọi món</p>
        <p className="text-5xl font-bold text-brand">{data.callNumber}</p>
        <p className="mt-2 font-semibold text-ink">{data.code}</p>
        <p data-testid="order-status" className="mt-2 inline-block rounded-full bg-tint px-3 py-1 text-sm font-semibold text-brand">
          {STATUS_LABEL[data.status]}
        </p>
        {data.status === 'PENDING_PAYMENT' && (
          <div className="mt-4">
            <Link href={`/checkout?orderId=${data.id}`} className="inline-flex min-h-11 items-center rounded-[10px] bg-brand px-6 text-sm font-semibold text-white">
              Thanh toán ngay
            </Link>
          </div>
        )}
      </div>

      <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
        {data.items.map((i, idx) => (
          <li key={idx} className="flex justify-between gap-3 p-4">
            <div>
              <p className="font-semibold text-ink">{i.quantity} × {i.productName}</p>
              <p className="text-[13px] text-muted">
                Size {i.size}
                {i.toppings.length > 0 && ` · ${i.toppings.map((t) => t.name).join(', ')}`}
                {i.note && ` · “${i.note}”`}
              </p>
            </div>
            <p className="font-semibold text-brand">{formatVnd(i.lineTotal)}</p>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-1 rounded-2xl border border-line bg-white p-4">
        <div className="flex justify-between">
          <span className="text-muted">Tổng cộng</span>
          <span data-testid="order-total" className="text-xl font-bold text-brand">{formatVnd(data.total)}</span>
        </div>
        {data.payment && (
          <p className="text-sm text-muted">
            {data.payment.method === 'CARD' ? `Thẻ •••• ${data.payment.cardLast4 ?? ''}` : 'Ví điện tử'}
          </p>
        )}
      </div>

      <ol aria-label="Dòng thời gian" className="flex flex-col gap-2 rounded-2xl border border-line bg-white p-4">
        {data.timeline.map((e, idx) => (
          <li key={idx} className="flex justify-between text-sm">
            <span className="font-medium text-ink">{STATUS_LABEL[e.status]}</span>
            <time dateTime={e.at} className="text-muted">{formatTime(e.at)}</time>
          </li>
        ))}
      </ol>
      <Link href="/orders" className="text-center text-sm font-medium text-muted underline">Xem lịch sử đơn</Link>
    </div>
  );
}

function NotFound() {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-line bg-white p-6 text-center">
      <p className="font-medium text-ink">Không tìm thấy đơn hàng.</p>
      <Link href="/orders" className="mt-4 inline-flex min-h-11 items-center rounded-[10px] bg-brand px-6 text-sm font-semibold text-white">Đơn hàng của tôi</Link>
    </div>
  );
}
