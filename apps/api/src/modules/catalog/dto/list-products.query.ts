import { IsOptional, Matches } from 'class-validator';

/** Query của GET /products. Sprint 1: lọc theo danh mục; tìm kiếm `q` (FR-17) làm ở Sprint 2. */
export class ListProductsQuery {
  @IsOptional()
  @Matches(/^[a-z0-9-]{1,50}$/, { message: 'category phải là slug hợp lệ' })
  category?: string;
}
