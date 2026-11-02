import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { ProductDetail, ProductSummary } from '@brewlite/shared';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';

/**
 * Integration test với PostgreSQL thật đã chạy `prisma migrate deploy` và `prisma db seed`.
 * Kiểm tra migration + seed tái tạo đúng dữ liệu menu (NFR-15) và API đọc đúng từ DB.
 */
const LATTE_ID = '2d8f6c0a-0000-4000-8000-000000000004';
const HIDDEN_ID = '2d8f6c0a-0000-4000-8000-000000000013';

describe('Catalog API + PostgreSQL (INT – FR-01, FR-02)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /products trả 12 món đang bán từ seed, không có món đã ẩn', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/products').expect(200);
    const products = res.body as ProductSummary[];

    expect(products).toHaveLength(12);
    expect(products.map((p) => p.id)).not.toContain(HIDDEN_ID);
    expect(products.find((p) => p.name === 'Cold brew cam sả')?.inStock).toBe(false);
    expect(products[0].category.slug).toBe('ca-phe');
  });

  it('GET /products?category=banh chỉ trả món thuộc danh mục Bánh', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/products?category=banh').expect(200);

    expect((res.body as ProductSummary[]).map((p) => p.category.slug)).toEqual(['banh', 'banh']);
  });

  it('GET /products/:id trả size S/M/L và topping của Latte', async () => {
    const res = await request(app.getHttpServer()).get(`/api/v1/products/${LATTE_ID}`).expect(200);
    const detail = res.body as ProductDetail;

    expect(detail.sizes.map((s) => s.code)).toEqual(['S', 'M', 'L']);
    expect(detail.toppings.map((t) => t.name).sort()).toEqual(['Kem cheese', 'Thêm shot espresso']);
  });

  it('GET /products/:id của món đã ẩn trả 404 PRODUCT_NOT_FOUND', async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/products/${HIDDEN_ID}`)
      .expect(404)
      .expect((res) => expect(res.body.code).toBe('PRODUCT_NOT_FOUND'));
  });

  it('GET /health trả db up', async () => {
    await request(app.getHttpServer()).get('/health').expect(200, { status: 'ok', db: 'up' });
  });
});
