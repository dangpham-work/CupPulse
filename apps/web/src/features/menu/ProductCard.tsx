import Image from 'next/image';
import { formatVnd, type ProductSummary } from '@brewlite/shared';

/** Thẻ món: ảnh, tên, giá; món hết hàng có nhãn "Hết hàng" (AC-01.4, AC-01.5). */
export function ProductCard({ product }: { product: ProductSummary }) {
  return (
    <article
      className={`flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200 ${
        product.inStock ? '' : 'opacity-70'
      }`}
    >
      <div className="relative aspect-square bg-brew-50">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className="object-contain p-4"
          unoptimized
        />
        {!product.inStock && (
          <span className="absolute left-2 top-2 rounded-full bg-stone-800 px-2.5 py-1 text-xs font-semibold text-white">
            Hết hàng
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h2 className="line-clamp-2 text-sm font-semibold text-stone-900">{product.name}</h2>
        <p className="mt-auto font-bold text-brew-700">{formatVnd(product.basePrice)}</p>
      </div>
    </article>
  );
}
