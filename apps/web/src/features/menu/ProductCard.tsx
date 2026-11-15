import Image from 'next/image';
import Link from 'next/link';
import { formatVnd, type ProductSummary } from '@brewlite/shared';

/** Thẻ món (Figma: ProductCard): ảnh 200px, tên, giá, nút "+". Món hết hàng có nhãn "Hết hàng" (AC-01.4, AC-01.5). */
export function ProductCard({ product }: { product: ProductSummary }) {
  const { inStock } = product;
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative aspect-square overflow-hidden bg-tint md:aspect-[5/4]">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className={`object-cover object-[50%_60%] transition duration-300 group-hover:scale-105 ${inStock ? '' : 'opacity-60 grayscale'}`}
          unoptimized
        />
        {!inStock && (
          <span className="absolute left-3.5 top-3.5 rounded-full bg-soldout px-2.5 py-1 text-xs font-semibold text-white">
            Hết hàng
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 px-4 py-4 md:px-[18px]">
        <h2 className={`line-clamp-2 text-[17px] font-semibold ${inStock ? 'text-ink' : 'text-muted'}`}>
          <Link href={`/products/${product.id}`} className="after:absolute after:inset-0">
            {product.name}
          </Link>
        </h2>
        <div className="mt-auto flex items-center justify-between pt-3">
          <p className={`text-lg font-bold ${inStock ? 'text-brand' : 'text-muted'}`}>{formatVnd(product.basePrice)}</p>
          <span
            aria-hidden="true"
            className={`flex size-9 items-center justify-center rounded-full text-xl font-semibold text-white ${
              inStock ? 'bg-brand' : 'bg-disabled'
            }`}
          >
            +
          </span>
        </div>
      </div>
    </article>
  );
}
