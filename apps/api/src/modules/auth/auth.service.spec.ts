import { compare } from 'bcryptjs';
import { AppException } from '../../common/app-exception';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';

const tokens = new TokenService({ secret: 'x'.repeat(32), expiresInSeconds: 3600 });

function makeService(user: { create?: jest.Mock; findUnique?: jest.Mock }) {
  const fake = { user: { create: user.create ?? jest.fn(), findUnique: user.findUnique ?? jest.fn() } };
  return new AuthService(fake as unknown as PrismaService, tokens);
}

describe('AuthService (UNIT – FR-09, FR-10)', () => {
  it('register lưu email chữ thường, mật khẩu bcrypt và vai trò CUSTOMER (AC-09.1, AC-09.4)', async () => {
    const create = jest.fn().mockImplementation(({ data }) =>
      Promise.resolve({ id: 'u1', role: 'CUSTOMER', loyaltyPoints: 0, phone: null, ...data }),
    );

    const result = await makeService({ create }).register({
      email: 'Khach@Example.COM',
      password: 'matkhau123',
      fullName: 'Nguyễn Văn A',
    });

    const data = create.mock.calls[0][0].data;
    expect(data.email).toBe('khach@example.com');
    expect(data.passwordHash).not.toContain('matkhau123');
    expect(await compare('matkhau123', data.passwordHash)).toBe(true);
    expect(result).toEqual({
      id: 'u1',
      email: 'khach@example.com',
      fullName: 'Nguyễn Văn A',
      role: 'CUSTOMER',
    });
    expect(JSON.stringify(result)).not.toMatch(/password/i);
  });

  it('register trả 409 EMAIL_TAKEN khi email đã tồn tại (AC-09.3)', async () => {
    const create = jest.fn().mockRejectedValue({ code: 'P2002' });

    await expect(
      makeService({ create }).register({ email: 'a@b.co', password: 'matkhau123', fullName: 'An' }),
    ).rejects.toMatchObject({ code: 'EMAIL_TAKEN', status: 409 });
  });

  it('login đúng thông tin trả accessToken, expiresIn 3600 và user (AC-10.1)', async () => {
    const { hashSync } = await import('bcryptjs');
    const findUnique = jest.fn().mockResolvedValue({
      id: 'u1',
      email: 'a@b.co',
      fullName: 'An',
      role: 'STAFF',
      passwordHash: hashSync('matkhau123', 4),
    });

    const result = await makeService({ findUnique }).login({ email: 'A@B.co', password: 'matkhau123' });

    expect(findUnique.mock.calls[0][0].where).toEqual({ email: 'a@b.co' });
    expect(result.expiresIn).toBe(3600);
    expect(result.user).toEqual({ id: 'u1', email: 'a@b.co', fullName: 'An', role: 'STAFF' });
    expect(tokens.verify(result.accessToken)).toEqual({ sub: 'u1', role: 'STAFF' });
  });

  it.each([
    ['sai email', null],
    ['sai mật khẩu', 'hash-of-other'],
  ])('login %s đều trả 401 INVALID_CREDENTIALS cùng thông báo (AC-10.2)', async (_name, hashKind) => {
    const { hashSync } = await import('bcryptjs');
    const findUnique = jest
      .fn()
      .mockResolvedValue(
        hashKind ? { id: 'u1', email: 'a@b.co', fullName: 'An', role: 'CUSTOMER', passwordHash: hashSync('khac-hoan-toan1', 4) } : null,
      );

    const error = await makeService({ findUnique })
      .login({ email: 'a@b.co', password: 'matkhau123' })
      .catch((e: AppException) => e);

    expect(error).toMatchObject({ code: 'INVALID_CREDENTIALS', status: 401 });
    expect((error as AppException).message).toBe('Email hoặc mật khẩu không đúng');
  });
});
