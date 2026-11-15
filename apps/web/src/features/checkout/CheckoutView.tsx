'use client';

import {
  formatVnd,
  PAYMENT_FAIL_MESSAGES,
  type CreateOrderInput,
  type OrderView,
  type PaymentFailReason,
  type PaymentInput,
  type PaymentResponse,
} from '@brewlite/shared';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/features/auth/AuthProvider';
import { useCart } from '@/features/cart/CartProvider';
import { ApiRequestError } from '@/lib/api';
import { PaymentForm } from './PaymentForm';

const MAX_POLLS = 40;
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

type Stage = 'review' | 'pay' | 'unpayable';

/** Đồng hồ đếm ngược giữ kho 15 phút (BR-08). */
function Countdown({ expiresAt, onExpired }: { expiresAt: string; onExpired: () => void }) {
  const [left, setLeft] = useState(() => Math.max(0, new Date(expiresAt).getTime() - Date.now()));
  useEffect(() => {
    const t = setInterval(() => {
      const next = Math.max(0, new Date(expiresAt).getTime() - Date.now());
      setLeft(next);
      if (next === 0) onExpired();
    }, 1000);
    return () => clearInterval(t);
  }, [expiresAt, onExpired]);
  const mm = String(Math.floor(left / 60000)).padStart(2, '0');
  const ss = String(Math.floor((left % 60000) / 1000)).padStart(2, '0');
  return (
    <p aria-live="off" className="text-sm font-medium text-accent">
      Giữ món còn <span className="font-bold">{mm}:{ss}</span>
    </p>
  );
}

/** Thanh toán (FR-04 → FR-06): xác nhận đơn rồi trả bằng Thẻ/Ví mô phỏng. `orderId` để thanh toán tiếp một đơn đang chờ. */
export function CheckoutView({ orderId, pollMs = 2500 }: { orderId?: string; pollMs?: number }) {
  const auth = useAuth();
  const cart = useCart();
  const router = useRouter();
  const [stage, setStage] = useState<Stage>('review');
  const [order, setOrder] = useState<OrderView | null>(null);
  const [expectedTotal, setExpectedTotal] = useState<number | null>(null);
  const [priceChanged, setPriceChanged] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [processing, setProcessing] = useState(false);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // AC-04.1: chưa đăng nhập thì sang /login, giỏ vẫn nằm trong localStorage.
  useEffect(() => {
    if (auth.ready && !auth.user) {
      const back = `/checkout${orderId ? `?orderId=${orderId}` : ''}`;
      router.replace(`/login?returnUrl=${encodeURIComponent(back)}`);
    }
  }, [auth.ready, auth.user, orderId, router]);

  // Thanh toán tiếp đơn có sẵn.
  useEffect(() => {
    if (!orderId || !auth.user) return;
    auth
      .request<OrderView>(`/orders/${orderId}`)
      .then(({ data }) => {
        if (!alive.current) return;
        setOrder(data);
        setStage(data.status === 'PENDING_PAYMENT' ? 'pay' : 'unpayable');
      })
      .catch(() => alive.current && setError('Không tải được đơn hàng.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, auth.user?.id]);

  if (!auth.ready || !auth.user) return <p className="text-center text-muted">Đang kiểm tra đăng nhập…</p>;

  const total = expectedTotal ?? cart.subtotal;

  async function placeOrder() {
    setBusy(true);
    setError(null);
    const body: CreateOrderInput = {
      items: cart.lines.map((l) => ({ productId: l.productId, size: l.size, toppingIds: l.toppingIds, note: l.note, quantity: l.qty })),
      expectedTotal: total,
    };
    try {
      const { data } = await auth.request<OrderView>('/orders', { method: 'POST', body });
      cart.clear(); // AC-04.8
      setOrder(data);
      setPriceChanged(false);
      setStage('pay');
    } catch (e) {
      if (!(e instanceof ApiRequestError)) setError('Không đặt được hàng. Vui lòng thử lại.');
      else if (e.code === 'PRICE_CHANGED') {
        const next = Number(e.details?.total);
        setExpectedTotal(next);
        setPriceChanged(true);
        setError(`Giá đã thay đổi, tổng mới là ${formatVnd(next)}. Vui lòng xác nhận lại.`);
      } else if (e.code === 'OUT_OF_STOCK' || e.code === 'PRODUCT_UNAVAILABLE') {
        const ids = (e.details?.productIds as string[] | undefined) ?? [];
        const names = cart.lines.filter((l) => ids.includes(l.productId)).map((l) => l.name);
        setError(`${e.code === 'OUT_OF_STOCK' ? 'Không đủ tồn kho' : 'Đã ngừng bán'}: ${names.join(', ') || 'một số món'}. Vui lòng chỉnh giỏ hàng.`);
      } else if (e.status !== 401) setError(e.message);
    } finally {
      if (alive.current) setBusy(false);
    }
  }

  async function pay(input: PaymentInput) {
    if (!order) return;
    setBusy(true);
    setError(null);
    const key = crypto.randomUUID(); // một khóa cho mỗi lần bấm, giữ nguyên khi chờ kết quả 202 (BR-11)
    try {
      for (let i = 0; i < MAX_POLLS; i += 1) {
        const res = await auth.request<PaymentResponse>('/payments', { method: 'POST', body: input, headers: { 'Idempotency-Key': key } });
        if (res.status !== 202) {
          router.push(`/orders/${order.id}`);
          return;
        }
        if (!alive.current) return;
        setProcessing(true);
        await sleep(pollMs);
      }
      setError('Thanh toán đang được xử lý lâu hơn dự kiến. Vui lòng kiểm tra lại trong "Đơn hàng của tôi".');
    } catch (e) {
      if (!(e instanceof ApiRequestError)) setError('Không thanh toán được. Vui lòng thử lại.');
      else if (e.code === 'PAYMENT_FAILED') {
        const reason = e.details?.reason as PaymentFailReason | undefined;
        setError((reason && PAYMENT_FAIL_MESSAGES[reason]) ?? 'Thanh toán thất bại. Vui lòng thử lại hoặc đổi phương thức.');
      } else if (e.code === 'ORDER_NOT_PAYABLE') {
        setStage('unpayable');
        setError('Đơn đã bị hủy hoặc hết hạn giữ món. Vui lòng đặt lại.');
      } else if (e.code === 'ORDER_ALREADY_PAID') router.push(`/orders/${order.id}`);
      else if (e.status !== 401) setError(e.message);
    } finally {
      if (alive.current) {
        setBusy(false);
        setProcessing(false);
      }
    }
  }

  if (stage === 'unpayable') {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-line bg-white p-6 text-center">
        {error && <p role="alert" className="font-medium text-[#8a1c10]">{error}</p>}
        {!error && <p className="font-medium text-ink">Đơn này không còn chờ thanh toán.</p>}
        <Link href="/" className="mt-4 inline-flex min-h-11 items-center rounded-[10px] bg-brand px-6 text-sm font-semibold text-white">Về thực đơn</Link>
      </div>
    );
  }

  if (stage === 'pay' && order) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 rounded-2xl border border-line bg-white p-6">
        <h1 className="text-2xl font-bold text-ink">Thanh toán</h1>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-ink">Đơn {order.code}</span>
          <span className="text-xl font-bold text-brand">{formatVnd(order.total)}</span>
        </div>
        <Countdown expiresAt={order.expiresAt} onExpired={() => { setStage('unpayable'); setError('Đơn đã hết hạn giữ món. Vui lòng đặt lại.'); }} />
        {processing && <p role="status" className="rounded-[10px] bg-tint px-3.5 py-2.5 text-sm font-medium text-brand">Đang xử lý thanh toán…</p>}
        {error && <p role="alert" className="rounded-[10px] bg-[#fdecea] px-3.5 py-2.5 text-sm font-medium text-[#8a1c10]">{error}</p>}
        <PaymentForm orderId={order.id} busy={busy} onSubmit={(input) => void pay(input)} />
      </div>
    );
  }

  if (cart.lines.length === 0) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-line bg-white p-8 text-center">
        <p className="text-lg font-semibold text-ink">Giỏ hàng trống</p>
        <Link href="/" className="mt-4 inline-flex min-h-11 items-center rounded-[10px] bg-brand px-6 text-sm font-semibold text-white">Xem thực đơn</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <h1 className="text-[28px] font-bold text-ink">Xác nhận đơn hàng</h1>
      <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
        {cart.lines.map((l) => (
          <li key={l.id} className="flex justify-between gap-3 p-4">
            <div>
              <p className="font-semibold text-ink">{l.qty} × {l.name}</p>
              <p className="text-[13px] text-muted">Size {l.size}{l.toppingNames.length > 0 && ` · ${l.toppingNames.join(', ')}`}{l.note && ` · “${l.note}”`}</p>
            </div>
            <p className="font-semibold text-brand">{formatVnd(l.unitPrice * l.qty)}</p>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between rounded-2xl border border-line bg-white p-4">
        <span className="text-muted">Tổng cộng</span>
        <span className="text-xl font-bold text-brand">{formatVnd(total)}</span>
      </div>
      {error && <p role="alert" className="rounded-[10px] bg-[#fdecea] px-3.5 py-2.5 text-sm font-medium text-[#8a1c10]">{error}</p>}
      <button type="button" onClick={() => void placeOrder()} disabled={busy} className="min-h-12 rounded-[10px] bg-brand text-[15px] font-semibold text-white disabled:opacity-60">
        {priceChanged ? 'Đồng ý giá mới và đặt hàng' : 'Xác nhận đặt hàng'}
      </button>
      <Link href="/cart" className="text-center text-sm font-medium text-muted underline">Quay lại giỏ hàng</Link>
    </div>
  );
}
