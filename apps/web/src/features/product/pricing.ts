import type { ProductDetail, SizeCode } from '@brewlite/shared';

type Priced = Pick<ProductDetail, 'name' | 'basePrice' | 'sizes' | 'toppings'>;

const dots = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/** Tổng tiền một dòng giỏ = (giá gốc + phụ thu size + topping) × số lượng. Size/topping lạ bị bỏ qua. */
export function lineTotal(product: Priced, size: SizeCode, toppingIds: string[], qty: number): number {
  const sizeExtra = product.sizes.find((s) => s.code === size)?.extraPrice ?? 0;
  const toppings = product.toppings.filter((t) => toppingIds.includes(t.id)).reduce((sum, t) => sum + t.price, 0);
  return (product.basePrice + sizeExtra + toppings) * qty;
}

/** Chuỗi giải thích giá ("Giá tự cập nhật" trong Figma). */
export function describePrice(product: Priced, size: SizeCode, toppingIds: string[], qty: number): string {
  const parts = [`${dots(product.basePrice)} (${product.name})`];
  const sizeExtra = product.sizes.find((s) => s.code === size)?.extraPrice ?? 0;
  if (sizeExtra > 0) parts.push(`${dots(sizeExtra)} (size ${size})`);
  for (const t of product.toppings.filter((t) => toppingIds.includes(t.id))) {
    parts.push(`${dots(t.price)} (${t.name})`);
  }
  return `${parts.join(' + ')} = ${dots(lineTotal(product, size, toppingIds, qty) / qty)} × ${qty}`;
}
