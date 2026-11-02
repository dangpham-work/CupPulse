import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import type { ProductDetail, ProductSummary } from '@brewlite/shared';
import { CatalogService } from './catalog.service';
import { ListProductsQuery } from './dto/list-products.query';

/** API công khai, không cần token (AC-01.1). */
@Controller('products')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  list(@Query() query: ListProductsQuery): Promise<ProductSummary[]> {
    return this.catalog.listProducts(query);
  }

  @Get(':id')
  detail(@Param('id', new ParseUUIDPipe()) id: string): Promise<ProductDetail> {
    return this.catalog.getProduct(id);
  }
}
