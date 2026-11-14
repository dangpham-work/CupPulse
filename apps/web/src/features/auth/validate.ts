import { VN_MOBILE } from '@brewlite/shared';

export type FieldErrors = Record<string, string>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Cùng quy tắc với backend (AC-09.2). */
export function validateRegister(input: { email: string; password: string; fullName: string; phone?: string }): FieldErrors {
  const errors: FieldErrors = {};
  if (!EMAIL.test(input.email.trim())) errors.email = 'Email không hợp lệ';
  if (!/^(?=.*[A-Za-z])(?=.*\d).{8,72}$/.test(input.password)) errors.password = 'Mật khẩu tối thiểu 8 ký tự, gồm chữ và số';
  const name = input.fullName.trim();
  if (name.length < 2 || name.length > 50) errors.fullName = 'Họ tên từ 2 đến 50 ký tự';
  if (input.phone && !VN_MOBILE.test(input.phone)) errors.phone = 'Số điện thoại phải là số di động Việt Nam 10 chữ số';
  return errors;
}

export function validateLogin(input: { email: string; password: string }): FieldErrors {
  const errors: FieldErrors = {};
  if (!EMAIL.test(input.email.trim())) errors.email = 'Email không hợp lệ';
  if (!input.password) errors.password = 'Vui lòng nhập mật khẩu';
  return errors;
}

/** Chỉ cho phép quay lại đường dẫn nội bộ (chống open redirect). */
export function safeReturnUrl(value: string | null | undefined): string {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/';
}
