import { z } from 'zod';

const DEV_JWT_SECRET = 'brewlite-dev-only-secret-khong-dung-o-production';

/** Biến môi trường được kiểm tra khi khởi động; sai thì dừng ngay (fail fast, ADR-008). */
const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
    DATABASE_URL: z.string().startsWith('postgres', 'DATABASE_URL phải là chuỗi kết nối PostgreSQL'),
    CORS_ORIGIN: z
      .string()
      .default('http://localhost:3000')
      .transform((value) => value.split(',').map((origin) => origin.trim()).filter(Boolean)),
    // JWT (ADR-006): bắt buộc khi production; môi trường khác dùng giá trị dev cố định.
    JWT_SECRET: z.string().min(32, 'JWT_SECRET phải dài ít nhất 32 ký tự').optional(),
    JWT_EXPIRES_IN: z.coerce.number().int().positive().default(3600),
  })
  .superRefine((value, ctx) => {
    if (value.NODE_ENV === 'production' && !value.JWT_SECRET) {
      ctx.addIssue({ code: 'custom', path: ['JWT_SECRET'], message: 'bắt buộc khi NODE_ENV=production' });
    }
  })
  .transform((value) => ({ ...value, JWT_SECRET: value.JWT_SECRET ?? DEV_JWT_SECRET }));

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Cấu hình môi trường không hợp lệ – ${issues}`);
  }
  return parsed.data;
}
