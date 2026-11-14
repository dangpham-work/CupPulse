/** Kiểm tra dữ liệu thanh toán dùng chung cho web và API (SRS AC-05.2, BR-18). */
import type { PaymentMethod } from './order';

export interface CardInput {
  number: string;
  expMonth: number;
  expYear: number;
  cvv: string;
}

export interface WalletInput {
  phone: string;
}

export interface PaymentInput {
  orderId: string;
  method: PaymentMethod;
  card?: CardInput;
  wallet?: WalletInput;
}

export type PaymentFieldErrors = Record<string, string>;

/** Thuật toán Luhn cho số thẻ gồm chữ số. */
export function luhnValid(digits: string): boolean {
  if (!/^\d+$/.test(digits)) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let d = Number(digits[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

/** SĐT di động Việt Nam 10 chữ số. */
export const VN_MOBILE = /^0(3|5|7|8|9)\d{8}$/;

export function cardBrand(number: string): string {
  if (number.startsWith('4')) return 'VISA';
  if (/^(5[1-5]|2[2-7])/.test(number)) return 'MASTERCARD';
  return 'CARD';
}

/** Trả về lỗi theo từng trường; object rỗng nghĩa là hợp lệ. `now` để test ổn định. */
export function validateCard(card: Partial<CardInput> | undefined, now: Date = new Date()): PaymentFieldErrors {
  const errors: PaymentFieldErrors = {};
  if (!card) return { card: 'Thiếu thông tin thẻ' };
  const number = (card.number ?? '').replace(/\s/g, '');
  if (!/^\d{16}$/.test(number) || !luhnValid(number)) errors['card.number'] = 'Số thẻ không hợp lệ';
  const { expMonth, expYear } = card;
  if (!Number.isInteger(expMonth) || !Number.isInteger(expYear) || expMonth! < 1 || expMonth! > 12) {
    errors['card.expMonth'] = 'Ngày hết hạn không hợp lệ';
  } else {
    const year = expYear! < 100 ? 2000 + expYear! : expYear!;
    const expired = year < now.getFullYear() || (year === now.getFullYear() && expMonth! < now.getMonth() + 1);
    if (expired) errors['card.expMonth'] = 'Thẻ đã hết hạn';
  }
  if (!/^\d{3}$/.test(card.cvv ?? '')) errors['card.cvv'] = 'CVV gồm 3 chữ số';
  return errors;
}

export function validateWallet(wallet: Partial<WalletInput> | undefined): PaymentFieldErrors {
  if (!wallet) return { wallet: 'Thiếu thông tin ví' };
  return VN_MOBILE.test(wallet.phone ?? '') ? {} : { 'wallet.phone': 'Số điện thoại phải là số di động Việt Nam 10 chữ số' };
}

export function validatePayment(input: Partial<PaymentInput>, now: Date = new Date()): PaymentFieldErrors {
  if (input.method === 'CARD') return validateCard(input.card, now);
  if (input.method === 'WALLET') return validateWallet(input.wallet);
  return { method: 'Phương thức thanh toán không hợp lệ' };
}

/** Kết quả POST /payments: 201 SUCCEEDED hoặc 202 PENDING (AC-05.4, AC-05.7). Thất bại là 402 PAYMENT_FAILED (details.reason). */
export interface PaymentResponse {
  paymentId: string;
  status: 'SUCCEEDED' | 'PENDING';
  orderStatus: 'PENDING_PAYMENT' | 'PAID';
}

/** Lý do thất bại trả về ở details.reason của lỗi 402. */
export type PaymentFailReason = 'CARD_DECLINED' | 'INSUFFICIENT_FUNDS' | 'WALLET_DECLINED';

export const PAYMENT_FAIL_MESSAGES: Record<PaymentFailReason, string> = {
  CARD_DECLINED: 'Thẻ bị từ chối. Vui lòng thử thẻ khác.',
  INSUFFICIENT_FUNDS: 'Thẻ không đủ số dư.',
  WALLET_DECLINED: 'Ví không đủ số dư hoặc bị từ chối.',
};

/** Thẻ/ví thử của gateway mô phỏng (docs/deployment.md, README). */
export const TEST_CARDS = {
  SUCCESS: '4242424242424242',
  DECLINED: '4000000000000002',
  INSUFFICIENT_FUNDS: '4000000000009995',
  TIMEOUT: '4000000000000119',
} as const;
export const TEST_WALLETS = { SUCCESS: '0912345678', DECLINED: '0900000000', TIMEOUT: '0900000001' } as const;
