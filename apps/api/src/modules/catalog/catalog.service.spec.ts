import { CatalogService } from './catalog.service';
import { AppException } from '../../common/app-exception';
import { PrismaService } from '../../prisma/prisma.service';
import { productRow } from '../../../test/fixtures';

function makeService(mocks: { findMany?: jest.Mock; findFirst?: jest.Mock }) {
  const fake = {
    product: { findMany: mocks.findMany ?? jest.fn(), findFirst: mocks.findFirst ?? jest.fn() },
  };
  return new CatalogService(fake as unknown as PrismaService);
}

describe('CatalogService (UNIT – FR-01, FR-02)', () => {
  it('listProducts chỉ truy vấn sản phẩm isActive = true (AC-01.2)', async () => {
    const findMany = jest.fn().mockResolvedValue([]);

    await makeService({ findMany }).listProducts({});

    expect(findMany.mock.calls[0][0].where).toEqual({ isActive: true });
  });

  it('listProducts lọc theo slug danh mục khi có query category', async () => {
    const findMany = jest.fn().mockResolvedValue([]);

    await makeService({ findMany }).listProducts({ category: 'ca-phe' });

    expect(findMany.mock.calls[0][0].where).toEqual({ isActive: true, category: { slug: 'ca-phe' } });
  });

  it('listProducts trả đúng hợp đồng AC-01.1, inStock = stock > 0', async () => {
    const findMany = jest
      .fn()
      .mockResolvedValue([productRow({ stock: 3 }), productRow({ id: 'p2', name: 'Hết', stock: 0 })]);

    const result = await makeService({ findMany }).listProducts({});

    expect(result).toEqual([
      {
        id: 'p1',
        name: 'Cà phê sữa',
        imageUrl: '/images/menu/coffee.svg',
        basePrice: 35000,
        category: { id: 'c1', name: 'Cà phê', slug: 'ca-phe' },
        inStock: true,
      },
      expect.objectContaining({ id: 'p2', inStock: false }),
    ]);
  });

  it('getProduct trả thêm description, sizes và toppings (AC-02.1)', async () => {
    const findFirst = jest.fn().mockResolvedValue(productRow());

    const detail = await makeService({ findFirst }).getProduct('p1');

    expect(findFirst.mock.calls[0][0].where).toEqual({ id: 'p1', isActive: true });
    expect(detail.description).toBe('Cà phê phin pha sữa đặc');
    expect(detail.sizes).toEqual([
      { code: 'S', name: 'Nhỏ', extraPrice: 0 },
      { code: 'M', name: 'Vừa', extraPrice: 5000 },
    ]);
    expect(detail.toppings).toEqual([{ id: 't1', name: 'Trân châu', price: 5000 }]);
  });

  it('getProduct bỏ topping đã ngừng bán', async () => {
    const row = productRow();
    row.toppings.push({ topping: { id: 't2', name: 'Ngừng bán', price: 1, isActive: false } });

    const detail = await makeService({ findFirst: jest.fn().mockResolvedValue(row) }).getProduct('p1');

    expect(detail.toppings.map((t) => t.id)).toEqual(['t1']);
  });

  it('getProduct ném PRODUCT_NOT_FOUND (404) khi không có hoặc đã ẩn (AC-02.2)', async () => {
    const service = makeService({ findFirst: jest.fn().mockResolvedValue(null) });

    const error = await service.getProduct('missing').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(AppException);
    expect(error).toMatchObject({ code: 'PRODUCT_NOT_FOUND' });
    expect((error as AppException).getStatus()).toBe(404);
  });
});
