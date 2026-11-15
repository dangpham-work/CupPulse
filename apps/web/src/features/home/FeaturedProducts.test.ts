import type { ProductSummary } from '@brewlite/shared';
import { describe, expect, it } from 'vitest';
import { pickFeatured } from './FeaturedProducts';

const cat = { id: 'c', name: 'Cà phê', slug: 'ca-phe' };
const p = (id: string, name: string, inStock = true): ProductSummary => ({
  id, name, imageUrl: `/images/menu/${id}.webp`, basePrice: 30000, category: cat, inStock,
});

describe('pickFeatured (trang chủ – món được yêu thích)', () => {
  it('ưu tiên các món đã chọn sẵn theo đúng thứ tự', () => {
    const list = [p('a', 'Latte'), p('b', 'Bánh tiramisu'), p('c', 'Cà phê sữa đá'), p('d', 'Trà đào cam sả'), p('e', 'Trà xanh matcha latte')];
    expect(pickFeatured(list).map((x) => x.name)).toEqual(['Cà phê sữa đá', 'Trà đào cam sả', 'Trà xanh matcha latte', 'Bánh tiramisu']);
  });

  it('bỏ món hết hàng và bù bằng món còn hàng khác cho đủ số lượng', () => {
    const list = [p('a', 'Cà phê sữa đá', false), p('b', 'Latte'), p('c', 'Bạc xỉu', false), p('d', 'Trà đào cam sả')];
    expect(pickFeatured(list, 3).map((x) => x.name)).toEqual(['Trà đào cam sả', 'Latte']);
  });

  it('không trùng món và không vượt quá số lượng yêu cầu', () => {
    const list = [p('a', 'Cà phê sữa đá'), p('b', 'Latte'), p('c', 'Bạc xỉu')];
    const picked = pickFeatured(list, 2);
    expect(picked).toHaveLength(2);
    expect(new Set(picked.map((x) => x.id)).size).toBe(2);
  });
});
