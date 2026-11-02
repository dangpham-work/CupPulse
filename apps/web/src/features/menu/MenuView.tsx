'use client';

import { useQuery } from '@tanstack/react-query';
import type { CategoryRef, ProductSummary } from '@brewlite/shared';
import { useMemo, useState } from 'react';
import { fetchProducts } from '@/lib/api';
import { ProductCard } from './ProductCard';

const ALL = 'all';

/** Màn menu (FR-01): ba trạng thái loading / empty / error theo AC-01.3. */
export function MenuView() {
  const { data, isPending, isError, refetch, isFetching } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });
  const [active, setActive] = useState<string>(ALL);

  const categories = useMemo(() => uniqueCategories(data ?? []), [data]);
  const visible = useMemo(
    () => (data ?? []).filter((p) => active === ALL || p.category.slug === active),
    [data, active],
  );

  if (isPending) {
    return <MenuSkeleton />;
  }

  if (isError) {
    return (
      <div role="alert" className="mx-4 mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-center">
        <p className="font-medium text-red-800">Không tải được menu. Vui lòng kiểm tra kết nối và thử lại.</p>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="mt-4 min-h-11 rounded-full bg-brew-700 px-6 font-semibold text-white disabled:opacity-60"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (data.length === 0) {
    return <p className="mt-16 text-center text-stone-500">Chưa có món nào</p>;
  }

  return (
    <>
      <div role="tablist" aria-label="Danh mục" className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3">
        {[{ slug: ALL, name: 'Tất cả' }, ...categories].map((c) => (
          <button
            key={c.slug}
            type="button"
            role="tab"
            aria-selected={active === c.slug}
            onClick={() => setActive(c.slug)}
            className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-semibold transition ${
              active === c.slug ? 'bg-brew-700 text-white' : 'bg-white text-stone-700 ring-1 ring-stone-200'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>
      <ul className="grid grid-cols-2 gap-3 px-4 pb-8 sm:grid-cols-3 lg:grid-cols-4">
        {visible.map((product) => (
          <li key={product.id}>
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
    </>
  );
}

function uniqueCategories(products: ProductSummary[]): CategoryRef[] {
  const seen = new Map<string, CategoryRef>();
  for (const p of products) {
    if (!seen.has(p.category.slug)) seen.set(p.category.slug, p.category);
  }
  return [...seen.values()];
}

function MenuSkeleton() {
  return (
    <div data-testid="menu-skeleton" aria-busy="true" aria-label="Đang tải menu" className="px-4">
      <div className="mb-3 flex gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-11 w-20 animate-pulse rounded-full bg-stone-200" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-56 animate-pulse rounded-2xl bg-stone-200" />
        ))}
      </div>
    </div>
  );
}
