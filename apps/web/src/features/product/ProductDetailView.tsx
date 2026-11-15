'use client';

import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { formatVnd, type ProductDetail, type SizeCode } from '@brewlite/shared';
import { useState } from 'react';
import { CART_LIMIT_MESSAGES, useCart } from '@/features/cart/CartProvider';
import { ApiRequestError, fetchProduct } from '@/lib/api';
import { describePrice, lineTotal } from './pricing';

const MAX_TOPPINGS = 3;

/** Màn chi tiết món (FR-02). Figma: 02 — Chi tiết món (Product detail). */
export function ProductDetailView({ id }: { id: string }) {
  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProduct(id),
    retry: (count, err) => !(err instanceof ApiRequestError && err.status === 404) && count < 1,
  });

  if (isPending) {
    return <div data-testid="detail-skeleton" aria-busy="true" aria-label="Đang tải món" className="h-[560px] animate-pulse rounded-2xl bg-line" />;
  }
  if (isError) {
    const notFound = error instanceof ApiRequestError && error.status === 404;
    return (
      <div role="alert" className="mx-auto mt-8 max-w-md rounded-2xl border border-line bg-white p-6 text-center">
        <p className="font-medium text-ink">{notFound ? 'Không tìm thấy món này.' : 'Không tải được món. Vui lòng thử lại.'}</p>
        {notFound ? (
          <Link href="/" className="mt-4 inline-flex min-h-11 items-center rounded-[10px] bg-brand px-6 text-sm font-semibold text-white">
            Về thực đơn
          </Link>
        ) : (
          <button type="button" onClick={() => void refetch()} disabled={isFetching} className="mt-4 min-h-11 rounded-[10px] bg-brand px-6 text-sm font-semibold text-white disabled:opacity-60">
            Thử lại
          </button>
        )}
      </div>
    );
  }
  return <DetailForm product={data} />;
}

function DetailForm({ product }: { product: ProductDetail }) {
  const cart = useCart();
  const [size, setSize] = useState<SizeCode>(product.sizes.find((s) => s.code === 'M')?.code ?? product.sizes[0]?.code ?? 'M');
  const [toppingIds, setToppingIds] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [limitError, setLimitError] = useState<string | null>(null);

  const total = lineTotal(product, size, toppingIds, qty);

  function toggle(topping: string) {
    setToppingIds((prev) =>
      prev.includes(topping) ? prev.filter((t) => t !== topping) : prev.length < MAX_TOPPINGS ? [...prev, topping] : prev,
    );
  }

  function addToCart() {
    const result = cart.add({
      productId: product.id,
      name: product.name,
      imageUrl: product.imageUrl,
      size,
      toppingIds,
      toppingNames: product.toppings.filter((t) => toppingIds.includes(t.id)).map((t) => t.name),
      note: note.trim(),
      qty,
      unitPrice: total / qty,
    });
    setAdded(result.ok);
    setLimitError(result.ok ? null : CART_LIMIT_MESSAGES[result.reason]);
  }

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Đường dẫn" className="text-sm font-medium text-muted">
        <Link href="/" className="hover:text-brand">Thực đơn</Link>
        {' / '}
        <span>{product.category.name}</span>
        {' / '}
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="flex flex-col gap-8 lg:flex-row lg:gap-14">
        <div className="relative aspect-square w-full rounded-3xl bg-tint lg:size-[580px] lg:shrink-0">
          <Image src={product.imageUrl} alt={product.name} fill sizes="(min-width: 1024px) 580px, 100vw" className="object-contain p-10" unoptimized />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-7">
          <div className="flex flex-col gap-2.5">
            <span className="self-start rounded-full bg-tint px-2.5 py-1 text-xs font-semibold text-accent">{product.category.name}</span>
            <h1 className="text-[32px] font-bold text-ink md:text-[40px]">{product.name}</h1>
            <p className="max-w-[640px] text-base leading-[26px] text-muted">{product.description}</p>
            <p className="text-[32px] font-bold text-brand">{formatVnd(product.basePrice)}</p>
          </div>

          <fieldset className="flex flex-col gap-3">
            <legend className="flex w-full items-baseline justify-between">
              <span className="text-[17px] font-semibold">Chọn size</span>
              <span className="text-[13px] font-medium text-accent">Bắt buộc</span>
            </legend>
            <div className="mt-3 flex gap-3">
              {product.sizes.map((s) => {
                const on = s.code === size;
                return (
                  <label
                    key={s.code}
                    className={`flex flex-1 cursor-pointer flex-col gap-1 rounded-xl px-4 py-3.5 ${
                      on ? 'border-2 border-brand bg-tint' : 'border border-line bg-white'
                    }`}
                  >
                    <input type="radio" name="size" value={s.code} checked={on} onChange={() => setSize(s.code)} className="sr-only" />
                    <span className={`text-xl font-bold ${on ? 'text-brand' : 'text-ink'}`}>{s.code}</span>
                    <span className="text-[13px] text-muted">{s.name}</span>
                    <span className={`text-sm font-semibold ${on ? 'text-brand' : 'text-ink'}`}>+{formatVnd(s.extraPrice)}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {product.toppings.length > 0 && (
            <fieldset className="flex flex-col gap-3">
              <legend className="flex w-full items-baseline justify-between">
                <span className="text-[17px] font-semibold">Thêm topping</span>
                <span className="text-[13px] font-medium text-muted">Tùy chọn · tối đa {MAX_TOPPINGS}</span>
              </legend>
              <ul className="mt-3 overflow-hidden rounded-xl border border-line bg-white">
                {product.toppings.map((t, i) => {
                  const on = toppingIds.includes(t.id);
                  const locked = !on && toppingIds.length >= MAX_TOPPINGS;
                  return (
                    <li key={t.id} className={i > 0 ? 'border-t border-line' : ''}>
                      <label className={`flex min-h-12 items-center gap-3 px-4 py-3.5 ${on ? 'bg-[#fdf8f3]' : ''} ${locked ? 'opacity-50' : 'cursor-pointer'}`}>
                        <input type="checkbox" checked={on} disabled={locked} onChange={() => toggle(t.id)} className="size-[22px] accent-brand" />
                        <span className={`flex-1 text-[15px] ${on ? 'font-semibold' : ''}`}>{t.name}</span>
                        <span className={`text-[15px] font-medium ${on ? 'text-brand' : 'text-muted'}`}>+{formatVnd(t.price)}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          )}

          <label className="flex flex-col gap-2">
            <span className="text-[17px] font-semibold">Ghi chú</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
              rows={3}
              placeholder="Ghi chú cho barista (ít đá, ít ngọt…)"
              className="rounded-xl border border-line bg-white px-4 py-3.5 text-[15px] outline-none placeholder:text-faint focus:border-brand"
            />
          </label>

          <div className="flex items-center gap-4">
            <div className="flex items-center rounded-[10px] border border-line bg-white">
              <button type="button" aria-label="Giảm số lượng" onClick={() => setQty((q) => Math.max(1, q - 1))} className="size-11 text-base font-medium text-brand">−</button>
              <span aria-live="polite" className="w-11 text-center text-base font-semibold">{qty}</span>
              <button type="button" aria-label="Tăng số lượng" onClick={() => setQty((q) => Math.min(10, q + 1))} className="size-11 text-base font-medium text-brand">+</button>
            </div>
            <button
              type="button"
              onClick={addToCart}
              disabled={!product.inStock}
              className="min-h-12 flex-1 rounded-[10px] bg-brand px-[22px] text-[15px] font-semibold text-white disabled:bg-disabled"
            >
              {product.inStock ? `Thêm vào giỏ · ${formatVnd(total)}` : 'Hết hàng'}
            </button>
          </div>
          {limitError && (
            <p role="alert" className="text-sm font-medium text-[#8a1c10]">
              {limitError}
            </p>
          )}
          {added && (
            <p role="status" className="text-sm font-medium text-brand">
              Đã thêm vào giỏ. <Link href="/cart" className="underline">Xem giỏ hàng</Link>
            </p>
          )}

          <p className="rounded-[10px] bg-tint px-3.5 py-2.5 text-[13px] text-brand">
            <span className="font-semibold">Giá tự cập nhật: </span>
            {describePrice(product, size, toppingIds, qty)}
          </p>
        </div>
      </div>
    </div>
  );
}
