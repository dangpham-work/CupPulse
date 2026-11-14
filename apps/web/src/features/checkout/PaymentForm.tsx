'use client';

import { validatePayment, type PaymentInput, type PaymentMethod } from '@brewlite/shared';
import { useState, type FormEvent } from 'react';
import { TextField } from '@/features/auth/TextField';

interface Props {
  orderId: string;
  busy: boolean;
  onSubmit: (input: PaymentInput) => void;
}

/** Nhóm số thẻ theo 4 chữ số cho dễ đọc. */
export function formatCardNumber(raw: string): string {
  return raw
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, '$1 ');
}

/** Tự chèn dấu / giữa tháng và năm. */
export function formatExpiry(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

/** Form Ví/Thẻ mô phỏng (FR-05). Số thẻ và CVV chỉ nằm trong state của form, không lưu và không log (BR-18). */
export function PaymentForm({ orderId, busy, onSubmit }: Props) {
  const [method, setMethod] = useState<PaymentMethod>('CARD');
  const [number, setNumber] = useState('');
  const [exp, setExp] = useState('');
  const [cvv, setCvv] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function submit(e: FormEvent) {
    e.preventDefault();
    const [mm = '', yy = ''] = exp.split('/');
    const input: PaymentInput =
      method === 'CARD'
        ? {
            orderId,
            method,
            card: { number: number.replace(/\s/g, ''), expMonth: Number(mm), expYear: Number(yy.length === 2 ? `20${yy}` : yy), cvv },
          }
        : { orderId, method, wallet: { phone } };
    const found = validatePayment(input);
    setErrors(found);
    if (Object.keys(found).length === 0) onSubmit(input);
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <fieldset className="flex gap-3">
        <legend className="mb-2 text-sm font-semibold text-ink">Phương thức thanh toán</legend>
        {(['CARD', 'WALLET'] as const).map((m) => (
          <label
            key={m}
            className={`flex min-h-12 flex-1 cursor-pointer items-center justify-center rounded-xl text-[15px] font-semibold ${
              method === m ? 'border-2 border-brand bg-tint text-brand' : 'border border-line bg-white text-ink'
            }`}
          >
            <input type="radio" name="method" value={m} checked={method === m} onChange={() => { setMethod(m); setErrors({}); }} className="sr-only" />
            {m === 'CARD' ? 'Thẻ' : 'Ví điện tử'}
          </label>
        ))}
      </fieldset>

      {method === 'CARD' ? (
        <>
          <TextField label="Số thẻ" name="cardNumber" inputMode="numeric" autoComplete="off" placeholder="4242 4242 4242 4242" value={number} onChange={(e) => setNumber(formatCardNumber(e.target.value))} error={errors['card.number']} />
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Hết hạn (MM/YY)" name="cardExp" inputMode="numeric" autoComplete="off" placeholder="12/30" maxLength={5} value={exp} onChange={(e) => setExp(formatExpiry(e.target.value))} error={errors['card.expMonth']} />
            <TextField label="CVV" name="cardCvv" inputMode="numeric" autoComplete="off" type="password" maxLength={3} value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))} error={errors['card.cvv']} />
          </div>
        </>
      ) : (
        <TextField label="Số điện thoại ví" name="walletPhone" type="tel" inputMode="numeric" autoComplete="off" placeholder="0912345678" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} error={errors['wallet.phone']} />
      )}

      <button type="submit" disabled={busy} className="min-h-12 rounded-[10px] bg-brand text-[15px] font-semibold text-white disabled:opacity-60">
        {busy ? 'Đang xử lý…' : 'Thanh toán'}
      </button>
    </form>
  );
}
