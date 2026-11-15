import type { ProductDetail } from '@brewlite/shared';
import { describe, expect, it } from 'vitest';
import { describePrice, lineTotal } from './pricing';

const product: Pick<ProductDetail, 'name' | 'basePrice' | 'sizes' | 'toppings'> = {
  name: 'Latte',
  basePrice: 45000,
  sizes: [
    { code: 'S', name: 'Nhỏ', extraPrice: 0 },
    { code: 'M', name: 'Vừa', extraPrice: 6000 },
  ],
  toppings: [
    { id: 't1', name: 'Kem cheese', price: 8000 },
    { id: 't2', name: 'Trân châu', price: 5000 },
  ],
};

describe('lineTotal', () => {
  it('cộng giá gốc, phụ thu size và topping rồi nhân số lượng', () => {
    expect(lineTotal(product, 'M', ['t1'], 1)).toBe(59000);
    expect(lineTotal(product, 'M', ['t1', 't2'], 2)).toBe(128000);
  });

  it('bỏ qua size/topping không tồn tại', () => {
    expect(lineTotal(product, 'L', ['zzz'], 1)).toBe(45000);
  });
});

describe('describePrice', () => {
  it('liệt kê từng thành phần giá theo mẫu trong Figma', () => {
    expect(describePrice(product, 'M', ['t1'], 1)).toBe('45.000 (Latte) + 6.000 (size M) + 8.000 (Kem cheese) = 59.000 × 1');
  });
});
