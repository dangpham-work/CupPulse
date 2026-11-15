'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import type { OrderStatus, OrderView } from '@brewlite/shared';
import { useAuth } from '@/features/auth/AuthProvider';
import { formatTime } from '@/features/orders/labels';

const COLUMNS: { status: OrderStatus; title: string; action: { label: string; next: OrderStatus } }[] = [
  { status: 'PAID', title: 'Đã thanh toán', action: { label: 'Bắt đầu pha', next: 'PREPARING' } },
  { status: 'PREPARING', title: 'Đang pha', action: { label: 'Xong, sẵn sàng', next: 'READY' } },
  { status: 'READY', title: 'Sẵn sàng', action: { label: 'Đã giao khách', next: 'COMPLETED' } },
];

/** Màn nhân viên quầy (FR-12): 3 cột, polling mỗi 3 s. Chỉ STAFF/MANAGER; server vẫn kiểm tra vai trò. */
export function StaffBoard({ pollMs = 3000 }: { pollMs?: number }) {
  const auth = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const allowed = auth.user?.role === 'STAFF' || auth.user?.role === 'MANAGER';

  useEffect(() => {
    if (auth.ready && !auth.user) router.replace(`/login?returnUrl=${encodeURIComponent('/staff')}`);
  }, [auth.ready, auth.user, router]);

  const { data, isError, refetch } = useQuery({
    queryKey: ['staff-orders'],
    enabled: allowed,
    queryFn: async () => (await auth.request<OrderView[]>('/staff/orders?status=PAID,PREPARING,READY')).data,
    refetchInterval: pollMs,
  });

  const move = useMutation({
    mutationFn: ({ id, next }: { id: string; next: OrderStatus }) =>
      auth.request<OrderView>(`/staff/orders/${id}/status`, { method: 'PATCH', body: { status: next } }),
    onSettled: () => qc.invalidateQueries({ queryKey: ['staff-orders'] }),
  });

  if (!auth.ready || !auth.user) return <p className="text-center text-muted">Đang kiểm tra đăng nhập…</p>;
  if (!allowed) return <p role="alert" className="text-center font-medium text-ink">Bạn không có quyền xem trang này.</p>;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-[28px] font-bold text-ink">Quầy pha chế</h1>
      {isError && (
        <p role="alert" className="rounded-[10px] bg-[#fdecea] px-3.5 py-2.5 text-sm font-medium text-[#8a1c10]">
          Không tải được danh sách đơn.{' '}
          <button type="button" onClick={() => void refetch()} className="underline">Thử lại</button>
        </p>
      )}
      {move.isError && (
        <p role="alert" className="rounded-[10px] bg-[#fdecea] px-3.5 py-2.5 text-sm font-medium text-[#8a1c10]">
          Không đổi được trạng thái đơn (có thể đã được cập nhật bởi người khác).
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const orders = (data ?? []).filter((o) => o.status === col.status);
          return (
            <section key={col.status} aria-label={col.title} className="flex flex-col gap-3 rounded-2xl bg-tint/60 p-3">
              <h2 className="flex items-center justify-between px-1 text-base font-bold text-brand">
                {col.title}
                <span className="rounded-full bg-white px-2 text-sm">{orders.length}</span>
              </h2>
              {orders.map((o) => (
                <article key={o.id} className="flex flex-col gap-2 rounded-xl border border-line bg-white p-3">
                  <div className="flex items-baseline justify-between">
                    <p className="text-2xl font-bold text-brand">{o.callNumber}</p>
                    <p className="text-xs text-muted">{formatTime(o.createdAt)}</p>
                  </div>
                  <ul className="flex flex-col gap-1 text-sm">
                    {o.items.map((i, idx) => (
                      <li key={idx}>
                        <span className="font-semibold">{i.quantity} × {i.productName}</span>
                        <span className="text-muted">
                          {' '}· Size {i.size}
                          {i.toppings.length > 0 && ` · ${i.toppings.map((t) => t.name).join(', ')}`}
                          {i.note && ` · “${i.note}”`}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    disabled={move.isPending}
                    onClick={() => move.mutate({ id: o.id, next: col.action.next })}
                    className="min-h-11 rounded-[10px] bg-brand text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {col.action.label}
                  </button>
                </article>
              ))}
            </section>
          );
        })}
      </div>
    </div>
  );
}
