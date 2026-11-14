import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';
import { productRow } from './fixtures';

const VALID_ID = '7f3c2a10-1b2c-4d5e-8f90-a1b2c3d4e5f6';

describe('Catalog API (API-T01, API-T02) – Prisma giả lập', () => {
  let app: INestApplication;
  const prisma = {
    product: { findMany: jest.fn(), findFirst: jest.fn() },
    $queryRaw: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();
    app = moduleRef.createNestApplication({ logger: false });
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => jest.resetAllMocks());

  it('GET /api/v1/products trả 200 không cần token (AC-01.1)', async () => {
    prisma.product.findMany.mockResolvedValue([productRow()]);

    const res = await request(app.getHttpServer()).get('/api/v1/products').expect(200);

    expect(res.body).toEqual([
      expect.objectContaining({ id: 'p1', name: 'Cà phê sữa', basePrice: 35000, inStock: true }),
    ]);
  });

  it('GET /api/v1/products?category=ca-phe được chấp nhận', async () => {
    prisma.product.findMany.mockResolvedValue([]);

    await request(app.getHttpServer()).get('/api/v1/products?category=ca-phe').expect(200, []);
  });

  it('GET /api/v1/products với query lạ trả 400 (NFR-05 whitelist)', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/products?admin=true').expect(400);

    expect(res.body).toMatchObject({ statusCode: 400, code: 'VALIDATION_ERROR' });
  });

  it('GET /api/v1/products/:id trả chi tiết (AC-02.1)', async () => {
    prisma.product.findFirst.mockResolvedValue(productRow());

    const res = await request(app.getHttpServer()).get(`/api/v1/products/${VALID_ID}`).expect(200);

    expect(res.body).toMatchObject({ id: 'p1', description: 'Cà phê phin pha sữa đặc' });
    expect(res.body.sizes).toHaveLength(2);
  });

  it('GET /api/v1/products/:id không tồn tại trả 404 PRODUCT_NOT_FOUND (AC-02.2)', async () => {
    prisma.product.findFirst.mockResolvedValue(null);

    const res = await request(app.getHttpServer()).get(`/api/v1/products/${VALID_ID}`).expect(404);

    expect(res.body).toEqual({
      statusCode: 404,
      code: 'PRODUCT_NOT_FOUND',
      message: 'Không tìm thấy sản phẩm',
    });
  });

  it('GET /api/v1/products/:id sai định dạng UUID trả 400 (AC-02.2)', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/products/abc').expect(400);

    expect(res.body).toMatchObject({ statusCode: 400, code: 'VALIDATION_ERROR' });
    expect(prisma.product.findFirst).not.toHaveBeenCalled();
  });

  it('Lỗi không lường trước trả 500 INTERNAL_ERROR, không lộ chi tiết', async () => {
    prisma.product.findMany.mockRejectedValue(new Error('connection refused at 10.0.0.5'));

    const res = await request(app.getHttpServer()).get('/api/v1/products').expect(500);

    expect(res.body).toEqual({ statusCode: 500, code: 'INTERNAL_ERROR', message: 'Lỗi hệ thống' });
  });

  it('GET /health trả 200 khi DB phản hồi (NFR-14)', async () => {
    prisma.$queryRaw.mockResolvedValue([{ ok: 1 }]);

    await request(app.getHttpServer()).get('/health').expect(200, { status: 'ok', db: 'up' });
  });

  it('GET /health trả 503 khi DB lỗi', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('down'));

    await request(app.getHttpServer()).get('/health').expect(503, { status: 'error', db: 'down' });
  });
});
