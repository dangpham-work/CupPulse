import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, IsUUID, MaxLength, ValidateNested } from 'class-validator';

class CardDto {
  @IsString()
  @MaxLength(23)
  number!: string;

  @IsInt()
  expMonth!: number;

  @IsInt()
  expYear!: number;

  @IsString()
  @MaxLength(4)
  cvv!: string;
}

class WalletDto {
  @IsString()
  @MaxLength(15)
  phone!: string;
}

/** AC-05.1. Kiểm tra sâu (Luhn, hạn dùng, SĐT) do `validatePayment` của @brewlite/shared đảm nhiệm. */
export class CreatePaymentDto {
  @IsUUID()
  orderId!: string;

  @IsIn(['CARD', 'WALLET'])
  method!: 'CARD' | 'WALLET';

  @IsOptional()
  @ValidateNested()
  @Type(() => CardDto)
  card?: CardDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => WalletDto)
  wallet?: WalletDto;
}
