import { PrismaService } from '../../prisma/prisma.service';
import { OrdersService } from './orders.service';

const NOW = new Date('2026-11-14T03:00:00.000Z'); // 10:00 giờ Việt Nam

function productRow(over: Record<string, unknown> = {}) {
  return {
    id: 'p1',
    name: 'Cà phê sữa đá',
    basePrice: 35000,
    isActive: true,
    stock: 10,
    sizes: [
      { code: 'S', name: 'Nhỏ', extraPrice: 0 },
      { code: 'L', name: 'Lớn', extraPrice: 10000 },
    ],
    toppings: [
      { topping: { id: 't1', name: 'Trân châu', price: 5000, isActive: true } },
      { topping: { id: 't2', name: 'Kem cheese', price: 10000, isActive: false } },
    ],
    ...over,
  };
}

function makeService(opts: { products?: unknown[]; updateCount?: number[]; counter?: number } = {}) {
  const updateMany = jest.fn();
  (opts.updateCount ?? [1, 1, 1]).forEach((count) => updateMany.mockResolvedValueOnce({ count }));
  const tx = {
    product: { findMany: jest.fn().mockResolvedValue(opts.products ?? [productRow()]), updateMany },
    orderCounter: { upsert: jest.fn().mockResolvedValue({ last: opts.counter ?? 7 }) },
    order: {
      create: jest.fn().mockImplementation(({ data }) =>
        Promise.resolve({
          id: 'o1',
          createdAt: NOW,
          ...data,
          items: data.items.create.map((i: object) => ({ ...i })),
          events: data.events.create.map((e: object) => ({ ...e, createdAt: NOW })),
          payments: [],
        }),
      ),
    },
  };
  const prisma = { $transaction: jest.fn((cb: (t: typeof tx) => unknown) => cb(tx)) };
  return { service: new OrdersService(prisma as unknown as PrismaService, () => NOW), tx };
}

const line = (over: Record<string, unknown> = {}) => ({
  productId: 'p1',
  size: 'L' as const,
  toppingIds: ['t1'],
  quantity: 2,
  ...over,
});

describe('OrdersService.create (UNIT – FR-04, BR-02, BR-05..BR-07, BR-16)', () => {
  it('tính giá ở server theo BR-02: (35.000 + 10.000 + 5.000) × 2 = 100.000 (AC-02.5)', async () => {
    const { service } = makeService();

    const order = await service.create('u1', { items: [line()] });

    expect(order.subtotal).toBe(100000);
    expect(order.discount).toBe(0);
    expect(order.total).toBe(100000);
    expect(order.status).toBe('PENDING_PAYMENT');
  });

  it('snapshot tên và đơn giá vào dòng đơn (BR-06, AC-04.7)', async () => {
    const { service, tx } = makeService();

    await service.create('u1', { items: [line({ note: 'ít đá' })] });

    const item = tx.order.create.mock.calls[0][0].data.items.create[0];
    expect(item).toMatchObject({
      productName: 'Cà phê sữa đá',
      size: 'L',
      sizeExtra: 10000,
      toppings: [{ id: 't1', name: 'Trân châu', price: 5000 }],
      note: 'ít đá',
      quantity: 2,
      unitPrice: 50000,
      lineTotal: 100000,
    });
  });

  it('đặt hết hạn sau 15 phút và có mã BL-YYMMDD-NNNN theo giờ Việt Nam (AC-04.4, BR-16)', async () => {
    const { service } = makeService({ counter: 7 });

    const order = await service.create('u1', { items: [line()] });

    expect(order.code).toBe('BL-261114-0007');
    expect(order.callNumber).toBe('0007');
    expect(order.expiresAt).toBe('2026-11-14T03:15:00.000Z');
  });

  it('trả 409 PRICE_CHANGED kèm tổng mới khi expectedTotal lệch (AC-04.3)', async () => {
    const { service, tx } = makeService();

    await expect(service.create('u1', { items: [line()], expectedTotal: 90000 })).rejects.toMatchObject({
      code: 'PRICE_CHANGED',
      status: 409,
      details: { total: 100000 },
    });
    expect(tx.order.create).not.toHaveBeenCalled();
  });

  it('trừ kho theo tổng số lượng mỗi sản phẩm bằng updateMany có điều kiện stock >= qty (BR-07)', async () => {
    const { service, tx } = makeService({ updateCount: [1] });

    await service.create('u1', { items: [line({ quantity: 2 }), line({ size: 'S', toppingIds: [], quantity: 3 })] });

    expect(tx.product.updateMany).toHaveBeenCalledTimes(1);
    expect(tx.product.updateMany).toHaveBeenCalledWith({
      where: { id: 'p1', stock: { gte: 5 } },
      data: { stock: { decrement: 5 } },
    });
  });

  it('trả 409 OUT_OF_STOCK với details.productIds khi một món không đủ kho (AC-04.5)', async () => {
    const { service, tx } = makeService({ updateCount: [0] });

    await expect(service.create('u1', { items: [line()] })).rejects.toMatchObject({
      code: 'OUT_OF_STOCK',
      status: 409,
      details: { productIds: ['p1'] },
    });
    expect(tx.order.create).not.toHaveBeenCalled();
  });

  it('trả 409 PRODUCT_UNAVAILABLE khi món ngừng bán hoặc không tồn tại (AC-04.6)', async () => {
    const { service } = makeService({ products: [productRow({ isActive: false })] });
    await expect(service.create('u1', { items: [line()] })).rejects.toMatchObject({ code: 'PRODUCT_UNAVAILABLE' });

    const none = makeService({ products: [] });
    await expect(none.service.create('u1', { items: [line()] })).rejects.toMatchObject({ code: 'PRODUCT_UNAVAILABLE' });
  });

  it('trả 400 khi size không thuộc sản phẩm hoặc topping không bán (AC-04.2)', async () => {
    const { service } = makeService();

    await expect(service.create('u1', { items: [line({ size: 'M' })] })).rejects.toMatchObject({
      code: 'INVALID_ITEM',
      status: 400,
    });
    await expect(service.create('u1', { items: [line({ toppingIds: ['t2'] })] })).rejects.toMatchObject({
      code: 'INVALID_ITEM',
      status: 400,
    });
    await expect(service.create('u1', { items: [line({ toppingIds: ['t1', 't1'] })] })).rejects.toMatchObject({
      code: 'INVALID_ITEM',
    });
  });

  it('từ chối đơn quá 20 ly (BR-03)', async () => {
    const { service } = makeService();

    await expect(
      service.create('u1', { items: [line({ quantity: 10 }), line({ quantity: 10 }), line({ size: 'S', quantity: 1 })] }),
    ).rejects.toMatchObject({ code: 'ORDER_TOO_LARGE', status: 400 });
  });
});
