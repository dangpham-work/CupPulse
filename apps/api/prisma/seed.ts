/**
 * Seed dữ liệu mẫu cho menu (Task 4.3). Chạy lại nhiều lần vẫn cho cùng kết quả:
 * mọi bản ghi có id cố định và được upsert.
 */
import { PrismaClient, SizeCode } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  { id: '0b6f4a8e-0000-4000-8000-000000000001', name: 'Cà phê', slug: 'ca-phe', sortOrder: 1 },
  { id: '0b6f4a8e-0000-4000-8000-000000000002', name: 'Trà', slug: 'tra', sortOrder: 2 },
  { id: '0b6f4a8e-0000-4000-8000-000000000003', name: 'Đá xay', slug: 'da-xay', sortOrder: 3 },
  { id: '0b6f4a8e-0000-4000-8000-000000000004', name: 'Bánh', slug: 'banh', sortOrder: 4 },
];

const toppings = [
  { id: '1c7e5b9f-0000-4000-8000-000000000001', name: 'Trân châu đen', price: 5000 },
  { id: '1c7e5b9f-0000-4000-8000-000000000002', name: 'Thạch cà phê', price: 5000 },
  { id: '1c7e5b9f-0000-4000-8000-000000000003', name: 'Kem cheese', price: 10000 },
  { id: '1c7e5b9f-0000-4000-8000-000000000004', name: 'Thêm shot espresso', price: 10000 },
];

const drinkSizes = [
  { code: SizeCode.S, name: 'Nhỏ', extraPrice: 0 },
  { code: SizeCode.M, name: 'Vừa', extraPrice: 5000 },
  { code: SizeCode.L, name: 'Lớn', extraPrice: 10000 },
];
const cakeSizes = [{ code: SizeCode.S, name: 'Tiêu chuẩn', extraPrice: 0 }];

type SeedProduct = {
  n: number;
  name: string;
  description: string;
  category: string;
  image: string;
  basePrice: number;
  stock: number;
  isActive?: boolean;
  toppings?: number[];
};

const products: SeedProduct[] = [
  { n: 1, name: 'Cà phê sữa đá', description: 'Cà phê phin đậm vị pha sữa đặc, uống cùng đá.', category: 'ca-phe', image: 'coffee', basePrice: 35000, stock: 50, toppings: [2, 4] },
  { n: 2, name: 'Cà phê đen đá', description: 'Cà phê phin nguyên chất, đắng nhẹ, hậu ngọt.', category: 'ca-phe', image: 'coffee', basePrice: 29000, stock: 50, toppings: [4] },
  { n: 3, name: 'Bạc xỉu', description: 'Nhiều sữa, ít cà phê, béo và ngọt dịu.', category: 'ca-phe', image: 'coffee', basePrice: 39000, stock: 40, toppings: [2, 3] },
  { n: 4, name: 'Latte', description: 'Espresso cùng sữa tươi đánh nóng.', category: 'ca-phe', image: 'coffee', basePrice: 45000, stock: 30, toppings: [3, 4] },
  { n: 5, name: 'Cold brew cam sả', description: 'Cà phê ủ lạnh 16 giờ với cam và sả.', category: 'ca-phe', image: 'coffee', basePrice: 49000, stock: 0, toppings: [] },
  { n: 6, name: 'Trà đào cam sả', description: 'Trà đen, đào miếng, cam tươi và sả.', category: 'tra', image: 'tea', basePrice: 45000, stock: 40, toppings: [1] },
  { n: 7, name: 'Trà sữa trân châu', description: 'Trà sữa đậm vị kèm trân châu đen.', category: 'tra', image: 'tea', basePrice: 39000, stock: 40, toppings: [1, 3] },
  { n: 8, name: 'Trà xanh matcha latte', description: 'Matcha Nhật pha sữa tươi.', category: 'tra', image: 'tea', basePrice: 49000, stock: 25, toppings: [1, 3] },
  { n: 9, name: 'Cà phê đá xay', description: 'Cà phê xay cùng đá và kem tươi.', category: 'da-xay', image: 'frappe', basePrice: 55000, stock: 20, toppings: [2, 3] },
  { n: 10, name: 'Socola đá xay', description: 'Socola Bỉ xay cùng đá và kem.', category: 'da-xay', image: 'frappe', basePrice: 55000, stock: 20, toppings: [1, 3] },
  { n: 11, name: 'Bánh croissant bơ', description: 'Croissant bơ Pháp nướng mỗi sáng.', category: 'banh', image: 'cake', basePrice: 32000, stock: 15 },
  { n: 12, name: 'Bánh tiramisu', description: 'Tiramisu mascarpone, rắc bột cacao.', category: 'banh', image: 'cake', basePrice: 42000, stock: 10 },
  { n: 13, name: 'Trà vải (ngừng bán)', description: 'Món theo mùa, đã ẩn khỏi menu.', category: 'tra', image: 'tea', basePrice: 45000, stock: 10, isActive: false, toppings: [1] },
];

const productId = (n: number) => `2d8f6c0a-0000-4000-8000-${String(n).padStart(12, '0')}`;
const toppingId = (n: number) => toppings[n - 1].id;

async function main(): Promise<void> {
  for (const c of categories) {
    await prisma.category.upsert({ where: { id: c.id }, update: c, create: c });
  }
  for (const t of toppings) {
    await prisma.topping.upsert({ where: { id: t.id }, update: t, create: t });
  }
  for (const p of products) {
    const id = productId(p.n);
    const category = categories.find((c) => c.slug === p.category)!;
    const data = {
      name: p.name,
      description: p.description,
      imageUrl: `/images/menu/${p.image}.svg`,
      basePrice: p.basePrice,
      stock: p.stock,
      isActive: p.isActive ?? true,
      categoryId: category.id,
    };
    const sizes = p.category === 'banh' ? cakeSizes : drinkSizes;
    await prisma.product.upsert({ where: { id }, update: data, create: { id, ...data } });
    await prisma.productSize.deleteMany({ where: { productId: id } });
    await prisma.productSize.createMany({ data: sizes.map((s) => ({ ...s, productId: id })) });
    await prisma.productTopping.deleteMany({ where: { productId: id } });
    await prisma.productTopping.createMany({
      data: (p.toppings ?? []).map((t) => ({ productId: id, toppingId: toppingId(t) })),
    });
  }
  console.log(`Seed xong: ${categories.length} danh mục, ${products.length} sản phẩm, ${toppings.length} topping.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
