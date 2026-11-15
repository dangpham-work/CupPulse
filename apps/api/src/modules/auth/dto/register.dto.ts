import { IsEmail, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';

/** SĐT di động Việt Nam 10 chữ số (AC-09.2). */
export const VN_MOBILE = /^0(3|5|7|8|9)\d{8}$/;

export class RegisterDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @MaxLength(254)
  email!: string;

  @IsString()
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).{8,72}$/, { message: 'Mật khẩu tối thiểu 8 ký tự, gồm chữ và số' })
  password!: string;

  @IsString()
  @Length(2, 50, { message: 'Họ tên từ 2 đến 50 ký tự' })
  fullName!: string;

  @IsOptional()
  @Matches(VN_MOBILE, { message: 'Số điện thoại phải là số di động Việt Nam 10 chữ số' })
  phone?: string;
}
