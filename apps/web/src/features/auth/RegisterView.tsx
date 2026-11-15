'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { ApiRequestError } from '@/lib/api';
import { useAuth } from './AuthProvider';
import { TextField } from './TextField';
import { safeReturnUrl, validateRegister, type FieldErrors } from './validate';

/** Màn đăng ký tài khoản khách hàng (FR-09). */
export function RegisterView() {
  const auth = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const returnUrl = safeReturnUrl(params.get('returnUrl'));
  const [form, setForm] = useState({ email: '', password: '', fullName: '', phone: '' });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const found = validateRegister(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      await auth.register({
        email: form.email.trim(),
        password: form.password,
        fullName: form.fullName.trim(),
        ...(form.phone ? { phone: form.phone } : {}),
      });
      router.push(`/login?registered=1&returnUrl=${encodeURIComponent(returnUrl)}`);
    } catch (error) {
      if (error instanceof ApiRequestError && error.code === 'EMAIL_TAKEN') {
        setErrors({ email: error.message });
      } else if (error instanceof ApiRequestError && error.status === 400) {
        setFormError('Thông tin chưa hợp lệ. Vui lòng kiểm tra lại các trường.');
      } else {
        setFormError('Không đăng ký được. Vui lòng thử lại.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="mx-auto flex w-full max-w-md flex-col gap-4 rounded-2xl border border-line bg-white p-6">
      <h1 className="text-2xl font-bold text-ink">Tạo tài khoản</h1>
      <TextField label="Email" name="email" type="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} />
      <TextField label="Mật khẩu" name="password" type="password" autoComplete="new-password" value={form.password} onChange={set('password')} error={errors.password} />
      <TextField label="Họ tên" name="fullName" autoComplete="name" value={form.fullName} onChange={set('fullName')} error={errors.fullName} />
      <TextField label="Số điện thoại (không bắt buộc)" name="phone" type="tel" inputMode="numeric" autoComplete="tel" value={form.phone} onChange={set('phone')} error={errors.phone} />
      {formError && (
        <p role="alert" className="rounded-[10px] bg-[#fdecea] px-3.5 py-2.5 text-sm font-medium text-[#8a1c10]">
          {formError}
        </p>
      )}
      <button type="submit" disabled={busy} className="min-h-12 rounded-[10px] bg-brand text-[15px] font-semibold text-white disabled:opacity-60">
        Tạo tài khoản
      </button>
      <p className="text-center text-sm text-muted">
        Đã có tài khoản?{' '}
        <Link href={`/login?returnUrl=${encodeURIComponent(returnUrl)}`} className="font-semibold text-brand underline">
          Đăng nhập
        </Link>
      </p>
    </form>
  );
}
