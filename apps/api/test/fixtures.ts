/** Dữ liệu giả lập một dòng Prisma Product (kèm quan hệ) cho unit/API test. */
export function productRow(overrides: Partial<{ id: string; name: string; stock: number }> = {}) {
  return {
    id: overrides.id ?? 'p1',
    name: overrides.name ?? 'Cà phê sữa',
    description: 'Cà phê phin pha sữa đặc',
    imageUrl: '/images/menu/coffee.svg',
    basePrice: 35000,
    stock: overrides.stock ?? 10,
    isActive: true,
    categoryId: 'c1',
    category: { id: 'c1', name: 'Cà phê', slug: 'ca-phe', sortOrder: 1 },
    sizes: [
      { id: 's1', productId: 'p1', code: 'S', name: 'Nhỏ', extraPrice: 0 },
      { id: 's2', productId: 'p1', code: 'M', name: 'Vừa', extraPrice: 5000 },
    ],
    toppings: [{ topping: { id: 't1', name: 'Trân châu', price: 5000, isActive: true } }],
    createdAt: new Date('2026-11-01T00:00:00Z'),
    updatedAt: new Date('2026-11-01T00:00:00Z'),
  };
}
