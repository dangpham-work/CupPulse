import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { TEST_CARDS } from '@brewlite/shared';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { MockGateway, PAYMENT_GATEWAY } from '../src/modules/payments/mock-gateway';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Integration test PostgreSQL thật cho tạo đơn và thanh toán (INT-T01 → INT-T07; FR-04, FR-05, FR-06, BR-07, BR-09, BR-10).
 * Cần DB đã migrate + seed. Dùng sản phẩm Bánh tiramisu (id …012) và croissant (…011); test tự đặt lại tồn kho.
 */
const TIRAMISU = '2d8f6c0a-0000-4000-8000-000000000012';
const CROISSANT = '2d8f6c0a-0000-4000-8000-000000000011';
const uuid = () => crypto.randomUUID();
const future = { expMonth: 12, expYear: 2035, cvv: '123' };

describe('Orders + Payments + PostgreSQL (INT – FR-04..FR-06)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let gateway: MockGateway;
  let clock = Date.now();
  let token: string;
  let userId: string;
  const server = () => app.getHttpServer();
  const auth = () => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    gateway = new MockGateway(() => clock);
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PAYMENT_GATEWAY)
      .useValue(gateway)
      .compile();
    app = moduleRef.createNestApplication({ logger: false });
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);

    const email = `int-${Date.now()}@brewlite.test`;
    await request(server()).post('/api/v1/auth/register').send({ email, password: 'matkhau123', fullName: 'Khach Int' }).expect(201);
    const login = await request(server()).post('/api/v1/auth/login').send({ email, password: 'matkhau123' }).expect(200);
    token = login.body.accessToken;
    userId = login.body.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await prisma.product.update({ where: { id: TIRAMISU }, data: { stock: 10 } });
    await prisma.product.update({ where: { id: CROISSANT }, data: { stock: 10 } });
    gateway.calls = 0;
  });

  const stock = async (id: string) => (await prisma.product.findUniqueOrThrow({ where: { id } })).stock;
  const order = (items: object[], expectedTotal?: number) =>
    request(server()).post('/api/v1/orders').set(auth()).send({ items, expectedTotal });
  const line = (productId: string, quantity: number) => ({ productId, size: 'S', quantity });
  const pay = (orderId: string, key: string, card: string = TEST_CARDS.SUCCESS) =>
    request(server())
      .post('/api/v1/payments')
      .set(auth())
      .set('Idempotency-Key', key)
      .send({ orderId, method: 'CARD', card: { number: card, ...future } });

  it('INT-T01: tạo đơn trừ kho đúng số lượng, snapshot giá và mã BL-YYMMDD-NNNN (AC-04.4, AC-04.7)', async () => {
    const res = await order([line(TIRAMISU, 2), line(CROISSANT, 1)], 2 * 42000 + 32000).expect(201);

    expect(res.body).toMatchObject({ status: 'PENDING_PAYMENT', subtotal: 116000, discount: 0, total: 116000 });
    expect(res.body.code).toMatch(/^BL-\d{6}-\d{4}$/);
    expect(await stock(TIRAMISU)).toBe(8);
    expect(await stock(CROISSANT)).toBe(9);

    await prisma.product.update({ where: { id: TIRAMISU }, data: { basePrice: 99000 } });
    const again = await request(server()).get(`/api/v1/orders/${res.body.id}`).set(auth()).expect(200);
    await prisma.product.update({ where: { id: TIRAMISU }, data: { basePrice: 42000 } });
    expect(again.body.total).toBe(116000);
  });

  it('INT-T02: một món thiếu kho thì cả đơn bị từ chối và tồn kho mọi món giữ nguyên (AC-04.5, BR-07)', async () => {
    await prisma.product.update({ where: { id: CROISSANT }, data: { stock: 0 } });

    const res = await order([line(TIRAMISU, 2), line(CROISSANT, 1)]).expect(409);

    expect(res.body.code).toBe('OUT_OF_STOCK');
    expect(res.body.details.productIds).toEqual([CROISSANT]);
    expect(await stock(TIRAMISU)).toBe(10);
  });

  it('INT-T03: đặt đồng thời không bao giờ làm tồn kho âm (BR-07)', async () => {
    await prisma.product.update({ where: { id: TIRAMISU }, data: { stock: 3 } });

    const results = await Promise.all(Array.from({ length: 6 }, () => order([line(TIRAMISU, 1)])));

    expect(results.filter((r) => r.status === 201)).toHaveLength(3);
    expect(results.filter((r) => r.status === 409)).toHaveLength(3);
    expect(await stock(TIRAMISU)).toBe(0);
  });

  it('INT-T04: thanh toán thành công chuyển đơn PAID; gửi lại cùng khóa nhận đúng kết quả cũ, gateway chỉ gọi 1 lần (AC-05.4, AC-06.2)', async () => {
    const created = await order([line(TIRAMISU, 1)]).expect(201);
    const key = uuid();

    const first = await pay(created.body.id, key).expect(201);
    const replay = await pay(created.body.id, key).expect(201);

    expect(first.body).toMatchObject({ status: 'SUCCEEDED', orderStatus: 'PAID' });
    expect(replay.body).toEqual(first.body);
    expect(gateway.calls).toBe(1);
    expect(await prisma.payment.count({ where: { orderId: created.body.id } })).toBe(1);
    const detail = await request(server()).get(`/api/v1/orders/${created.body.id}`).set(auth()).expect(200);
    expect(detail.body.status).toBe('PAID');
    expect(detail.body.payment).toEqual({ method: 'CARD', cardLast4: '4242' });
    expect(detail.body.timeline.map((e: { status: string }) => e.status)).toEqual(['PENDING_PAYMENT', 'PAID']);
  });

  it('INT-T05: cùng khóa khác nội dung trả 422; khóa mới cho đơn đã PAID trả 409 (AC-06.3, AC-06.5)', async () => {
    const created = await order([line(TIRAMISU, 1)]).expect(201);
    const key = uuid();
    await pay(created.body.id, key).expect(201);

    const reused = await pay(created.body.id, key, TEST_CARDS.DECLINED).expect(422);
    const second = await pay(created.body.id, uuid()).expect(409);

    expect(reused.body.code).toBe('IDEMPOTENCY_KEY_REUSED');
    expect(second.body.code).toBe('ORDER_ALREADY_PAID');
    expect(await prisma.payment.count({ where: { orderId: created.body.id, status: 'SUCCEEDED' } })).toBe(1);
  });

  it('INT-T06: thanh toán lỗi 3 lần thì đơn CANCELLED và hoàn kho; không lưu số thẻ đầy đủ (AC-05.5, AC-05.6, AC-05.8)', async () => {
    const created = await order([line(TIRAMISU, 2)]).expect(201);
    expect(await stock(TIRAMISU)).toBe(8);

    for (let i = 0; i < 2; i += 1) {
      const res = await pay(created.body.id, uuid(), TEST_CARDS.DECLINED).expect(402);
      expect(res.body).toMatchObject({ code: 'PAYMENT_FAILED', details: { reason: 'CARD_DECLINED' } });
    }
    expect((await prisma.order.findUniqueOrThrow({ where: { id: created.body.id } })).status).toBe('PENDING_PAYMENT');
    await pay(created.body.id, uuid(), TEST_CARDS.DECLINED).expect(402);

    expect((await prisma.order.findUniqueOrThrow({ where: { id: created.body.id } })).status).toBe('CANCELLED');
    expect(await stock(TIRAMISU)).toBe(10);
    const rows = JSON.stringify(await prisma.payment.findMany({ where: { orderId: created.body.id } }));
    expect(rows).not.toContain('4000000000000002');
    expect(rows).not.toContain('"cvv"');
  });

  it('INT-T07: gateway chậm trả 202 PENDING, gửi lại cùng khóa sau khi chốt nhận 201 (AC-05.7)', async () => {
    const created = await order([line(TIRAMISU, 1)]).expect(201);
    const key = uuid();

    const first = await pay(created.body.id, key, TEST_CARDS.TIMEOUT).expect(202);
    expect(first.body).toMatchObject({ status: 'PENDING', orderStatus: 'PENDING_PAYMENT' });
    await pay(created.body.id, key, TEST_CARDS.TIMEOUT).expect(202);

    clock += 6_000;
    const final = await pay(created.body.id, key, TEST_CARDS.TIMEOUT).expect(201);

    expect(final.body).toMatchObject({ status: 'SUCCEEDED', orderStatus: 'PAID' });
    expect(gateway.calls).toBe(1);
  });

  it('INT-T08: thiếu hoặc sai Idempotency-Key trả 400; thẻ sai Luhn trả 400 không gọi gateway (AC-05.2, AC-06.1)', async () => {
    const created = await order([line(TIRAMISU, 1)]).expect(201);

    await request(server())
      .post('/api/v1/payments')
      .set(auth())
      .send({ orderId: created.body.id, method: 'CARD', card: { number: TEST_CARDS.SUCCESS, ...future } })
      .expect(400);
    await pay(created.body.id, 'khong-phai-uuid').expect(400);
    await pay(created.body.id, uuid(), '4242424242424241').expect(400);
    expect(gateway.calls).toBe(0);
  });

  it('INT-T09: đơn quá hạn giữ kho bị hủy và hoàn kho (BR-08); người khác xem đơn nhận 404 (BR-17)', async () => {
    const created = await order([line(CROISSANT, 3)]).expect(201);
    expect(await stock(CROISSANT)).toBe(7);

    const other = await prisma.user.create({
      data: { email: `other-${Date.now()}@brewlite.test`, passwordHash: 'x', fullName: 'Nguoi Khac' },
    });
    const { TokenService } = await import('../src/modules/auth/token.service');
    const otherToken = app.get(TokenService).sign({ sub: other.id, role: 'CUSTOMER' });
    await request(server()).get(`/api/v1/orders/${created.body.id}`).set('Authorization', `Bearer ${otherToken}`).expect(404);

    await prisma.order.update({ where: { id: created.body.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
    await pay(created.body.id, uuid()).expect(409);

    expect(await stock(CROISSANT)).toBe(10);
    expect((await prisma.order.findUniqueOrThrow({ where: { id: created.body.id } })).userId).toBe(userId);
  });
});
