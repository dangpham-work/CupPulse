'use client';

import { useQuery } from '@tanstack/react-query';
import type { CategoryRef, ProductSummary } from '@brewlite/shared';
import { useMemo, useState } from 'react';
import { fetchProducts } from '@/lib/api';
import { ProductCard } from './ProductCard';

const ALL = 'all';

/** Màn menu (FR-01): ba trạng thái loading / empty / error theo AC-01.3. Figma: 01 — Thực đơn + 08 — Trạng thái UI. */
export function MenuView() {
  const { data, isPending, isError, refetch, isFetching } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });
  const [active, setActive] = useState<string>(ALL);
  const [term, setTerm] = useState('');

  const categories = useMemo(() => uniqueCategories(data ?? []), [data]);
  const visible = useMemo(() => {
    const q = normalize(term);
    return (data ?? []).filter(
      (p) => (active === ALL || p.category.slug === active) && (q === '' || normalize(p.name).includes(q)),
    );
  }, [data, active, term]);

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-[28px] font-bold text-ink md:text-4xl">Thực đơn hôm nay</h1>
          <p className="text-base text-muted">Chọn món yêu thích — tùy chỉnh size và topping ở bước tiếp theo.</p>
        </div>
        <label className="flex h-12 w-full items-center gap-2.5 rounded-xl border border-line bg-white px-4 md:w-[360px]">
          <SearchIcon />
          <input
            type="search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Tìm món: latte, trà đào…"
            aria-label="Tìm món"
            className="w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-faint"
          />
        </label>
      </div>

      {isPending ? <MenuSkeleton /> : isError ? <MenuError onRetry={() => void refetch()} busy={isFetching} /> : data.length === 0 ? (
        <p className="mt-16 text-center text-muted">Chưa có món nào</p>
      ) : (
        <>
          <div role="tablist" aria-label="Danh mục" className="no-scrollbar mb-6 flex gap-2.5 overflow-x-auto">
            {[{ slug: ALL, name: 'Tất cả' }, ...categories].map((c) => (
              <button
                key={c.slug}
                type="button"
                role="tab"
                aria-selected={active === c.slug}
                onClick={() => setActive(c.slug)}
                className={`min-h-11 shrink-0 rounded-full px-[18px] text-sm font-semibold transition ${
                  active === c.slug ? 'bg-brand text-white' : 'border border-line bg-white text-ink'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
          {visible.length === 0 ? (
            <p className="mt-12 text-center text-muted">Không tìm thấy món phù hợp</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 pb-8 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
              {visible.map((product) => (
                <li key={product.id}>
                  <ProductCard product={product} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </>
  );
}

function MenuError({ onRetry, busy }: { onRetry: () => void; busy: boolean }) {
  return (
    <div role="alert" className="mx-auto mt-8 max-w-md rounded-2xl border border-line bg-white p-6 text-center">
      <p className="font-medium text-ink">Không tải được menu. Vui lòng kiểm tra kết nối và thử lại.</p>
      <button
        type="button"
        onClick={onRetry}
        disabled={busy}
        className="mt-4 min-h-11 rounded-[10px] bg-brand px-6 text-sm font-semibold text-white disabled:opacity-60"
      >
        Thử lại
      </button>
    </div>
  );
}

function normalize(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().trim();
}

function uniqueCategories(products: ProductSummary[]): CategoryRef[] {
  const seen = new Map<string, CategoryRef>();
  for (const p of products) {
    if (!seen.has(p.category.slug)) seen.set(p.category.slug, p.category);
  }
  return [...seen.values()];
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true" stroke="#7a6a60" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="6.5" cy="6.5" r="5" />
      <path d="m10.5 10.5 3.5 3.5" />
    </svg>
  );
}

function MenuSkeleton() {
  return (
    <div data-testid="menu-skeleton" aria-busy="true" aria-label="Đang tải menu">
      <div className="mb-6 flex gap-2.5">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-11 w-20 animate-pulse rounded-full bg-line" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="h-[340px] animate-pulse rounded-2xl bg-line" />
        ))}
      </div>
    </div>
  );
}
