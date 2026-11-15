'use client';

import { useQuery } from '@tanstack/react-query';
import type { ProductSummary } from '@brewlite/shared';
import Link from 'next/link';
import { fetchProducts } from '@/lib/api';
import { ProductCard } from '@/features/menu/ProductCard';
import { SectionHeading } from './HomeSections';

/** Món được giới thiệu ở trang chủ; thiếu món nào thì lấy thêm món còn hàng khác cho đủ 4. */
const FEATURED = ['Cà phê sữa đá', 'Trà đào cam sả', 'Trà xanh matcha latte', 'Bánh tiramisu'];

export function pickFeatured(products: ProductSummary[], count = 4): ProductSummary[] {
  const chosen = FEATURED.map((name) => products.find((p) => p.name === name && p.inStock)).filter(
    (p): p is ProductSummary => Boolean(p),
  );
  for (const p of products) {
    if (chosen.length >= count) break;
    if (p.inStock && !chosen.includes(p)) chosen.push(p);
  }
  return chosen.slice(0, count);
}

/** "Món được yêu thích" ở trang chủ; dùng chung cache ['products'] với trang Thực đơn. */
export function FeaturedProducts() {
  const { data, isPending, isError } = useQuery({ queryKey: ['products'], queryFn: fetchProducts });
  if (isError) return null;
  const items = data ? pickFeatured(data) : [];
  return (
    <section aria-labelledby="featured-title" className="mx-auto w-full max-w-[1440px] px-4 py-12 md:px-10 md:py-16 lg:px-20">
      <SectionHeading
        id="featured-title"
        eyebrow="Bán chạy"
        title="Món được yêu thích"
        action={
          <Link href="/menu" className="text-[15px] font-semibold text-brand underline-offset-4 hover:underline">
            Xem toàn bộ thực đơn →
          </Link>
        }
      />
      <ul className="mt-8 grid grid-cols-2 gap-3 md:gap-6 lg:grid-cols-4">
        {isPending
          ? Array.from({ length: 4 }, (_, i) => <li key={i} className="h-[320px] animate-pulse rounded-2xl bg-line" />)
          : items.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} />
              </li>
            ))}
      </ul>
    </section>
  );
}
