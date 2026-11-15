import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateOrderItemDto {
  @IsUUID()
  productId!: string;

  @IsIn(['S', 'M', 'L'])
  size!: 'S' | 'M' | 'L';

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3, { message: 'Tối đa 3 topping mỗi ly' })
  @IsUUID('all', { each: true })
  toppingIds?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Ghi chú tối đa 100 ký tự' })
  note?: string;

  @IsInt()
  @Min(1)
  @Max(10)
  quantity!: number;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Đơn phải có ít nhất 1 món' })
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  @IsOptional()
  @IsInt()
  @Min(0)
  expectedTotal?: number;
}

export class ListOrdersQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
