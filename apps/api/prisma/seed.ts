/**
 * Seed dữ liệu mẫu cho menu (Task 4.3). Chạy lại nhiều lần vẫn cho cùng kết quả:
 * mọi bản ghi có id cố định và được upsert.
 */
import { PrismaClient, Role, SizeCode } from '@prisma/client';
import { hashSync } from 'bcryptjs';

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
  {
    n: 1, name: 'Cà phê sữa đá', category: 'ca-phe', image: 'ca-phe-sua-da', basePrice: 35000, stock: 50, toppings: [2, 4],
    description:
      'Ly cà phê đặc trưng của Sài Gòn: cà phê Robusta rang mộc được nhỏ giọt chậm qua phin nhôm, hòa cùng sữa đặc rồi khuấy đều với đá viên. ' +
      'Vị đậm, đắng vừa, béo ngọt và thơm mùi cà phê rang. Muốn tỉnh táo hơn, bạn thêm một shot espresso; thích nhai giòn thì chọn thạch cà phê.',
  },
  {
    n: 2, name: 'Cà phê đen đá', category: 'ca-phe', image: 'ca-phe-den-da', basePrice: 29000, stock: 50, toppings: [4],
    description:
      'Cà phê phin nguyên chất, pha đậm rồi rót lên đá, không thêm sữa. Vị đắng rõ, hậu ngọt và thơm mùi gỗ, chocolate đặc trưng của Robusta Việt Nam. ' +
      'Hợp với người thích cà phê "thật", cần tỉnh táo cho buổi sáng hoặc giờ làm việc. Có thể thêm shot espresso cho vị mạnh hơn.',
  },
  {
    n: 3, name: 'Bạc xỉu', category: 'ca-phe', image: 'bac-xiu', basePrice: 39000, stock: 40, toppings: [2, 3],
    description:
      'Phiên bản "nhiều sữa, ít cà phê" quen thuộc của người Sài Gòn: sữa đặc và sữa tươi làm nền, cà phê phin nhỏ giọt lên trên tạo lớp màu nâu nhạt. ' +
      'Vị béo, ngọt dịu, chỉ thoảng vị đắng nên dễ uống cho người mới làm quen cà phê. Hợp nhất khi thêm thạch cà phê hoặc lớp kem cheese mặn nhẹ.',
  },
  {
    n: 4, name: 'Latte', category: 'ca-phe', image: 'latte', basePrice: 45000, stock: 30, toppings: [3, 4],
    description:
      'Espresso pha máy kết hợp sữa tươi đánh nóng mịn, phủ lớp bọt sữa mỏng có vẽ latte art. ' +
      'Vị cà phê nhẹ, êm và béo của sữa, ít ngọt; có thể dùng nóng hoặc đá. Thêm shot espresso nếu bạn muốn đậm hơn, hoặc kem cheese cho vị béo mặn.',
  },
  {
    n: 5, name: 'Cold brew cam sả', category: 'ca-phe', image: 'cold-brew-cam-sa', basePrice: 49000, stock: 0, toppings: [],
    description:
      'Cà phê Arabica ủ lạnh 16 giờ nên ít đắng và ít chua, uống mượt. Thêm nước cam tươi và sả đập dập tạo lớp màu cam – nâu bắt mắt. ' +
      'Vị chua ngọt của cam, hương sả the mát quyện cùng cà phê, rất hợp ngày nắng nóng. Món pha theo mẻ nên số lượng có hạn mỗi ngày.',
  },
  {
    n: 6, name: 'Trà đào cam sả', category: 'tra', image: 'tra-dao-cam-sa', basePrice: 45000, stock: 40, toppings: [1],
    description:
      'Trà đen ủ lạnh pha cùng siro đào, đào miếng giòn, cam vàng cắt lát và sả tươi. ' +
      'Vị trà thanh, chua ngọt hài hòa, thơm mùi đào và sả, uống mát lạnh và không gắt. Đào miếng ăn kèm được; thêm trân châu đen nếu muốn có gì nhai.',
  },
  {
    n: 7, name: 'Trà sữa trân châu', category: 'tra', image: 'tra-sua-tran-chau', basePrice: 39000, stock: 40, toppings: [1, 3],
    description:
      'Trà đen Assam pha đậm, hòa cùng sữa béo, kèm trân châu đen nấu đường nâu mỗi ngày. ' +
      'Vị trà rõ, ngọt vừa, trân châu dẻo dai. Muốn nhiều trân châu hơn thì chọn thêm topping, hoặc phủ kem cheese để có vị mặn béo.',
  },
  {
    n: 8, name: 'Trà xanh matcha latte', category: 'tra', image: 'matcha-latte', basePrice: 49000, stock: 25, toppings: [1, 3],
    description:
      'Bột matcha Nhật Bản được đánh tan với nước ấm rồi rót lên sữa tươi và đá, tạo hai lớp xanh – trắng. ' +
      'Vị trà xanh thơm, hơi chát nhẹ ở hậu, béo vừa và ít ngọt. Kết hợp đẹp với kem cheese hoặc trân châu đen.',
  },
  {
    n: 9, name: 'Cà phê đá xay', category: 'da-xay', image: 'ca-phe-da-xay', basePrice: 55000, stock: 20, toppings: [2, 3],
    description:
      'Cà phê espresso xay nhuyễn cùng sữa và đá thành hỗn hợp sánh mịn, mát lạnh như kem, phủ kem tươi. ' +
      'Vị cà phê rõ nhưng dịu, ngọt béo, thích hợp buổi chiều nóng. Thêm thạch cà phê để có độ dai, hoặc kem cheese cho vị béo mặn.',
  },
  {
    n: 10, name: 'Socola đá xay', category: 'da-xay', image: 'socola-da-xay', basePrice: 55000, stock: 20, toppings: [1, 3],
    description:
      'Socola đen Bỉ xay cùng sữa tươi và đá, phủ kem tươi và rưới sốt socola quanh thành ly. ' +
      'Vị cacao đậm, ngọt béo, không chứa cà phê nên phù hợp cả trẻ em và người không uống được caffeine. Ngon hơn khi thêm trân châu đen.',
  },
  {
    n: 11, name: 'Bánh croissant bơ', category: 'banh', image: 'croissant-bo', basePrice: 32000, stock: 15,
    description:
      'Bánh sừng bò cán bằng bơ lạt kiểu Pháp, nướng mới mỗi sáng tại quầy. ' +
      'Vỏ giòn xốp nhiều lớp, ruột mềm và thơm mùi bơ. Ăn kèm cà phê đen hoặc latte cho bữa sáng nhanh; số lượng có hạn mỗi ngày.',
  },
  {
    n: 12, name: 'Bánh tiramisu', category: 'banh', image: 'tiramisu', basePrice: 42000, stock: 10,
    description:
      'Bánh tiramisu kiểu Ý: lớp bánh lady finger thấm espresso xen kẽ kem phô mai mascarpone, rắc bột cacao nguyên chất. ' +
      'Vị béo mịn, ngọt vừa, thoảng đắng của cà phê và cacao. Bánh được bảo quản lạnh, ngon nhất khi dùng trong ngày.',
  },
  {
    n: 13, name: 'Trà vải (ngừng bán)', category: 'tra', image: 'tra-vai', basePrice: 45000, stock: 10, isActive: false, toppings: [1],
    description:
      'Trà đen pha cùng vải thiều ngâm và vài lát chanh, chỉ bán theo mùa vải. Món hiện đã ẩn khỏi menu và sẽ quay lại vào mùa sau.',
  },
];

/** Tài khoản demo (staff/manager/khách). Mật khẩu lấy từ SEED_DEMO_PASSWORD, mặc định chỉ dùng cho local/demo. */
const demoPassword = process.env.SEED_DEMO_PASSWORD ?? 'Brewlite123';
const users = [
  { id: '3e9a7d1b-0000-4000-8000-000000000001', email: 'khach@brewlite.test', fullName: 'Khách Demo', role: Role.CUSTOMER },
  { id: '3e9a7d1b-0000-4000-8000-000000000002', email: 'nhanvien@brewlite.test', fullName: 'Nhân Viên Quầy', role: Role.STAFF },
  { id: '3e9a7d1b-0000-4000-8000-000000000003', email: 'quanly@brewlite.test', fullName: 'Quản Lý Cửa Hàng', role: Role.MANAGER },
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
      imageUrl: `/images/menu/${p.image}.webp`,
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
  const passwordHash = hashSync(demoPassword, 12);
  for (const u of users) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: { fullName: u.fullName, role: u.role },
      create: { ...u, passwordHash },
    });
  }
  console.log(`Seed xong: ${categories.length} danh mục, ${products.length} sản phẩm, ${toppings.length} topping, ${users.length} tài khoản demo.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
