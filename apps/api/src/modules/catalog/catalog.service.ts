import { HttpStatus, Injectable } from '@nestjs/common';
import type { ProductDetail, ProductSummary } from '@brewlite/shared';
import { Prisma } from '@prisma/client';
import { AppException } from '../../common/app-exception';
import { PrismaService } from '../../prisma/prisma.service';
import { ListProductsQuery } from './dto/list-products.query';

const productInclude = {
  category: true,
  sizes: { orderBy: { extraPrice: 'asc' } },
  toppings: { include: { topping: true } },
} satisfies Prisma.ProductInclude;

type ProductRow = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  /** FR-01: danh sách sản phẩm đang bán, theo thứ tự danh mục rồi tên. */
  async listProducts(query: ListProductsQuery): Promise<ProductSummary[]> {
    const where: Prisma.ProductWhereInput = { isActive: true };
    if (query.category) {
      where.category = { slug: query.category };
    }
    const rows = await this.prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: [{ category: { sortOrder: 'asc' } }, { name: 'asc' }],
    });
    return rows.map(toSummary);
  }

  /** FR-02: chi tiết sản phẩm kèm size và topping đang bán. */
  async getProduct(id: string): Promise<ProductDetail> {
    const row = await this.prisma.product.findFirst({
      where: { id, isActive: true },
      include: productInclude,
    });
    if (!row) {
      throw new AppException('PRODUCT_NOT_FOUND', 'Không tìm thấy sản phẩm', HttpStatus.NOT_FOUND);
    }
    return toDetail(row);
  }
}

function toSummary(row: Pick<ProductRow, 'id' | 'name' | 'imageUrl' | 'basePrice' | 'stock' | 'category'>): ProductSummary {
  return {
    id: row.id,
    name: row.name,
    imageUrl: row.imageUrl,
    basePrice: row.basePrice,
    category: { id: row.category.id, name: row.category.name, slug: row.category.slug },
    inStock: row.stock > 0,
  };
}

function toDetail(row: ProductRow): ProductDetail {
  return {
    ...toSummary(row),
    description: row.description,
    sizes: row.sizes.map((s) => ({ code: s.code, name: s.name, extraPrice: s.extraPrice })),
    toppings: row.toppings
      .map((pt) => pt.topping)
      .filter((t) => t.isActive)
      .map((t) => ({ id: t.id, name: t.name, price: t.price })),
  };
}
