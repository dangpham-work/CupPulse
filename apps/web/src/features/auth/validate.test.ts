import { describe, expect, it } from 'vitest';
import { safeReturnUrl, validateLogin, validateRegister } from './validate';

describe('validateRegister (AC-09.2)', () => {
  const ok = { email: 'a@b.co', password: 'matkhau123', fullName: 'An Nguyen' };

  it('hợp lệ thì không có lỗi', () => {
    expect(validateRegister(ok)).toEqual({});
    expect(validateRegister({ ...ok, phone: '0912345678' })).toEqual({});
  });

  it('báo lỗi theo từng trường', () => {
    expect(validateRegister({ ...ok, email: 'abc' }).email).toBeDefined();
    expect(validateRegister({ ...ok, password: 'abcdefgh' }).password).toBeDefined(); // thiếu số
    expect(validateRegister({ ...ok, password: '12345678' }).password).toBeDefined(); // thiếu chữ
    expect(validateRegister({ ...ok, password: 'a1' }).password).toBeDefined();
    expect(validateRegister({ ...ok, fullName: 'A' }).fullName).toBeDefined();
    expect(validateRegister({ ...ok, phone: '0212345678' }).phone).toBeDefined();
  });
});

describe('validateLogin', () => {
  it('cần email hợp lệ và mật khẩu', () => {
    expect(validateLogin({ email: 'a@b.co', password: 'x' })).toEqual({});
    expect(Object.keys(validateLogin({ email: '', password: '' }))).toEqual(['email', 'password']);
  });
});

describe('safeReturnUrl', () => {
  it('chỉ nhận đường dẫn nội bộ', () => {
    expect(safeReturnUrl('/checkout')).toBe('/checkout');
    expect(safeReturnUrl('https://evil.test')).toBe('/');
    expect(safeReturnUrl('//evil.test')).toBe('/');
    expect(safeReturnUrl(null)).toBe('/');
  });
});
