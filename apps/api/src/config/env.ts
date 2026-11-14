import { z } from 'zod';

/** Biến môi trường được kiểm tra khi khởi động; sai thì dừng ngay (fail fast, ADR-008). */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().startsWith('postgres', 'DATABASE_URL phải là chuỗi kết nối PostgreSQL'),
  CORS_ORIGIN: z
    .string()
    .default('http://localhost:3000')
    .transform((value) => value.split(',').map((origin) => origin.trim()).filter(Boolean)),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Cấu hình môi trường không hợp lệ – ${issues}`);
  }
  return parsed.data;
}
