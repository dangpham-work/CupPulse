import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { hashSync } from 'bcryptjs';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { loadEnv } from '../src/config/env';
import { TokenService } from '../src/modules/auth/token.service';
import { PrismaService } from '../src/prisma/prisma.service';

const UID = '3e9a7d1b-0000-4000-8000-000000000001';
const PRODUCT = '2d8f6c0a-0000-4000-8000-000000000001';

describe('Auth + Orders API (API-T03 → API-T07) – Prisma giả lập', () => {
  let app: INestApplication;
  const prisma = {
    user: { create: jest.fn(), findUnique: jest.fn() },
    order: { findMany: jest.fn(), findFirst: jest.fn(), count: jest.fn(), updateMany: jest.fn(), findUnique: jest.fn() },
    $transaction: jest.fn(),
  };
  const env = loadEnv({ DATABASE_URL: 'postgresql://x' });
  const tokens = new TokenService({ secret: env.JWT_SECRET, expiresInSeconds: 3600 });
  const bearer = (role: 'CUSTOMER' | 'STAFF' | 'MANAGER', sub = UID) => `Bearer ${tokens.sign({ sub, role })}`;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();
    app = moduleRef.createNestApplication({ logger: false });
    configureApp(app);
    await app.init();
  });
  afterAll(async () => app.close());
  beforeEach(() => jest.resetAllMocks());

  it('API-T03: POST /auth/register 201, không lộ passwordHash (AC-09.1, AC-09.4)', async () => {
    prisma.user.create.mockImplementation(({ data }) => Promise.resolve({ id: UID, role: 'CUSTOMER', ...data }));

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'A@b.co', password: 'matkhau123', fullName: 'An Nguyen' })
      .expect(201);

    expect(res.body).toEqual({ id: UID, email: 'a@b.co', fullName: 'An Nguyen', role: 'CUSTOMER' });
    expect(JSON.stringify(res.body)).not.toMatch(/password/i);
  });

  it('API-T03: register sai định dạng trả 400 (AC-09.2); email trùng trả 409 EMAIL_TAKEN (AC-09.3)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'khong-phai-email', password: 'abc', fullName: 'A' })
      .expect(400);

    prisma.user.create.mockRejectedValue({ code: 'P2002' });
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'a@b.co', password: 'matkhau123', fullName: 'An Nguyen' })
      .expect(409);
    expect(res.body.code).toBe('EMAIL_TAKEN');
  });

  it('API-T04: POST /auth/login 200 có accessToken; sai mật khẩu 401 (AC-10.1, AC-10.2)', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: UID,
      email: 'a@b.co',
      fullName: 'An',
      role: 'CUSTOMER',
      passwordHash: hashSync('matkhau123', 4),
    });

    const ok = await request(app.getHttpServer()).post('/api/v1/auth/login').send({ email: 'a@b.co', password: 'matkhau123' }).expect(200);
    expect(ok.body.expiresIn).toBe(3600);
    expect(tokens.verify(ok.body.accessToken)).toEqual({ sub: UID, role: 'CUSTOMER' });

    const bad = await request(app.getHttpServer()).post('/api/v1/auth/login').send({ email: 'a@b.co', password: 'sai-mat-khau1' }).expect(401);
    expect(bad.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('API-T05: /orders và /staff/orders không token trả 401 (AC-04.1, AC-10.3)', async () => {
    await request(app.getHttpServer()).post('/api/v1/orders').send({}).expect(401);
    await request(app.getHttpServer()).get('/api/v1/orders').expect(401);
    await request(app.getHttpServer()).get('/api/v1/staff/orders').expect(401);
    await request(app.getHttpServer()).get('/api/v1/orders').set('Authorization', 'Bearer rac').expect(401);
  });

  it('API-T06: CUSTOMER gọi /staff/* nhận 403, STAFF và MANAGER qua (AC-11.2, AC-11.3)', async () => {
    prisma.order.findMany.mockResolvedValue([]);

    await request(app.getHttpServer()).get('/api/v1/staff/orders').set('Authorization', bearer('CUSTOMER')).expect(403);
    await request(app.getHttpServer()).get('/api/v1/staff/orders').set('Authorization', bearer('STAFF')).expect(200, []);
    await request(app.getHttpServer()).get('/api/v1/staff/orders').set('Authorization', bearer('MANAGER')).expect(200, []);
  });

  it('API-T07: POST /orders body sai trả 400, không tạo đơn (AC-04.2)', async () => {
    const auth = bearer('CUSTOMER');
    const post = (body: object) => request(app.getHttpServer()).post('/api/v1/orders').set('Authorization', auth).send(body);

    await post({}).expect(400);
    await post({ items: [] }).expect(400);
    await post({ items: [{ productId: PRODUCT, size: 'XL', quantity: 1 }] }).expect(400);
    await post({ items: [{ productId: PRODUCT, size: 'S', quantity: 11 }] }).expect(400);
    await post({
      items: [{ productId: PRODUCT, size: 'S', quantity: 1, toppingIds: [PRODUCT, PRODUCT, PRODUCT, PRODUCT] }],
    }).expect(400);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('API-T07: GET /orders/:id của người khác trả 404 ORDER_NOT_FOUND (BR-17)', async () => {
    prisma.order.findFirst.mockResolvedValue(null);

    const res = await request(app.getHttpServer())
      .get(`/api/v1/orders/${PRODUCT}`)
      .set('Authorization', bearer('CUSTOMER'))
      .expect(404);

    expect(res.body.code).toBe('ORDER_NOT_FOUND');
    expect(prisma.order.findFirst.mock.calls[0][0].where).toEqual({ id: PRODUCT, userId: UID });
  });
});
