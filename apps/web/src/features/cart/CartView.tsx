'use client';

import Image from 'next/image';
import Link from 'next/link';
import { formatVnd } from '@brewlite/shared';
import { useState } from 'react';
import { CART_LIMIT_MESSAGES, useCart } from './CartProvider';

/** Màn giỏ hàng (FR-03). */
export function CartView() {
  const cart = useCart();
  const [error, setError] = useState<string | null>(null);

  function change(id: string, qty: number) {
    const res = cart.setQty(id, qty);
    setError(res.ok ? null : CART_LIMIT_MESSAGES[res.reason]);
  }

  if (cart.lines.length === 0) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-line bg-white p-8 text-center">
        <p className="text-lg font-semibold text-ink">Giỏ hàng trống</p>
        <p className="mt-1 text-sm text-muted">Hãy chọn vài món từ thực đơn nhé.</p>
        <Link href="/" className="mt-5 inline-flex min-h-11 items-center rounded-[10px] bg-brand px-6 text-sm font-semibold text-white">
          Xem thực đơn
        </Link>
        <button type="button" disabled className="mt-3 block min-h-11 w-full rounded-[10px] bg-disabled text-sm font-semibold text-white">
          Đặt hàng
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <h1 className="text-[28px] font-bold text-ink">Giỏ hàng</h1>
      <ul className="flex flex-col gap-3">
        {cart.lines.map((l) => (
          <li key={l.id} className="flex gap-3 rounded-2xl border border-line bg-white p-3">
            <div className="relative size-20 shrink-0 rounded-xl bg-tint">
              <Image src={l.imageUrl} alt="" fill sizes="80px" className="object-contain p-2" unoptimized />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-ink">{l.name}</p>
                <button
                  type="button"
                  aria-label={`Xóa ${l.name}`}
                  onClick={() => {
                    cart.remove(l.id);
                    setError(null);
                  }}
                  className="min-h-11 px-2 text-sm font-medium text-muted hover:text-brand"
                >
                  Xóa
                </button>
              </div>
              <p className="text-[13px] text-muted">
                Size {l.size}
                {l.toppingNames.length > 0 && ` · ${l.toppingNames.join(', ')}`}
                {l.note && ` · “${l.note}”`}
              </p>
              <div className="mt-1 flex items-center justify-between">
                <div className="flex items-center rounded-[10px] border border-line">
                  <button type="button" aria-label={`Giảm số lượng ${l.name}`} onClick={() => change(l.id, l.qty - 1)} disabled={l.qty <= 1} className="size-11 text-brand disabled:opacity-40">
                    −
                  </button>
                  <span aria-label={`Số lượng ${l.name}`} className="w-8 text-center font-semibold">
                    {l.qty}
                  </span>
                  <button type="button" aria-label={`Tăng số lượng ${l.name}`} onClick={() => change(l.id, l.qty + 1)} className="size-11 text-brand">
                    +
                  </button>
                </div>
                <p className="font-semibold text-brand">{formatVnd(l.unitPrice * l.qty)}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {error && (
        <p role="alert" className="rounded-[10px] bg-[#fdecea] px-3.5 py-2.5 text-sm font-medium text-[#8a1c10]">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between rounded-2xl border border-line bg-white p-4">
        <span className="text-muted">Tạm tính ({cart.count} ly)</span>
        <span data-testid="subtotal" className="text-xl font-bold text-brand">
          {formatVnd(cart.subtotal)}
        </span>
      </div>
      <Link href="/checkout" className="flex min-h-12 items-center justify-center rounded-[10px] bg-brand text-[15px] font-semibold text-white">
        Đặt hàng
      </Link>
    </div>
  );
}
