'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { ApiRequestError } from '@/lib/api';
import { useAuth } from './AuthProvider';
import { TextField } from './TextField';
import { safeReturnUrl, validateLogin, type FieldErrors } from './validate';

/** Màn đăng nhập (FR-10). returnUrl giữ nguyên để quay lại trang thanh toán (AC-04.1). */
export function LoginView() {
  const auth = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const returnUrl = safeReturnUrl(params.get('returnUrl'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const found = validateLogin({ email, password });
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      await auth.login({ email: email.trim(), password });
      router.replace(returnUrl);
    } catch (error) {
      setFormError(
        error instanceof ApiRequestError && error.code === 'INVALID_CREDENTIALS'
          ? error.message
          : 'Không đăng nhập được. Vui lòng thử lại.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="mx-auto flex w-full max-w-md flex-col gap-4 rounded-2xl border border-line bg-white p-6">
      <h1 className="text-2xl font-bold text-ink">Đăng nhập</h1>
      {params.get('registered') && (
        <p role="status" className="rounded-[10px] bg-tint px-3.5 py-2.5 text-sm font-medium text-brand">
          Đăng ký thành công. Hãy đăng nhập để tiếp tục.
        </p>
      )}
      <TextField label="Email" name="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
      <TextField label="Mật khẩu" name="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
      {formError && (
        <p role="alert" className="rounded-[10px] bg-[#fdecea] px-3.5 py-2.5 text-sm font-medium text-[#8a1c10]">
          {formError}
        </p>
      )}
      <button type="submit" disabled={busy} className="min-h-12 rounded-[10px] bg-brand text-[15px] font-semibold text-white disabled:opacity-60">
        Đăng nhập
      </button>
      <p className="text-center text-sm text-muted">
        Chưa có tài khoản?{' '}
        <Link href={`/register?returnUrl=${encodeURIComponent(returnUrl)}`} className="font-semibold text-brand underline">
          Đăng ký
        </Link>
      </p>
    </form>
  );
}
