import { loadEnv } from './env';

describe('loadEnv (UNIT – ADR-008 fail fast)', () => {
  it('đọc giá trị mặc định và tách CORS_ORIGIN', () => {
    const env = loadEnv({ DATABASE_URL: 'postgresql://u:p@localhost:5432/db', CORS_ORIGIN: 'http://a.test, http://b.test' });

    expect(env.PORT).toBe(4000);
    expect(env.CORS_ORIGIN).toEqual(['http://a.test', 'http://b.test']);
  });

  it('báo lỗi khi thiếu DATABASE_URL', () => {
    expect(() => loadEnv({})).toThrow(/DATABASE_URL/);
  });
});
