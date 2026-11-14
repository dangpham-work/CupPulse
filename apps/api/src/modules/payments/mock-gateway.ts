import { Inject, Injectable, Optional } from '@nestjs/common';
import type { PaymentFailReason } from '@brewlite/shared';

export type GatewayOutcome =
  | { state: 'SUCCEEDED' }
  | { state: 'FAILED'; reason: PaymentFailReason }
  | { state: 'PENDING' };

export interface GatewayRequest {
  method: 'CARD' | 'WALLET';
  amount: number;
  card?: { number: string };
  wallet?: { phone: string };
}

/** Cổng thanh toán (Payment Service). Bản thật sẽ hiện thực cùng giao diện này. */
export interface PaymentGateway {
  charge(ref: string, request: GatewayRequest): Promise<GatewayOutcome>;
  status(ref: string): Promise<GatewayOutcome>;
}

export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');
export const GATEWAY_CLOCK = Symbol('GATEWAY_CLOCK');
export const SETTLE_AFTER_MS = 5_000;

/**
 * Payment Service mô phỏng (ADR-005). Kết quả quyết định bằng số thẻ/ví thử, không cần mạng:
 *  4242…4242 thành công · 4000…0002 từ chối · 4000…9995 thiếu số dư · 4000…0119 chậm (PENDING, 5 giây sau thành công).
 *  Ví 0900000000 từ chối · 0900000001 chậm · số khác thành công.
 * Không lưu và không ghi log số thẻ (BR-18).
 */
@Injectable()
export class MockGateway implements PaymentGateway {
  /** Số lần gọi charge, để test kiểm chứng "Payment Service chỉ được gọi một lần" (AC-06.2). */
  calls = 0;
  private readonly settleAt = new Map<string, number>();

  constructor(@Optional() @Inject(GATEWAY_CLOCK) private readonly now: () => number = () => Date.now()) {}

  charge(ref: string, request: GatewayRequest): Promise<GatewayOutcome> {
    this.calls += 1;
    const outcome = this.decide(request);
    if (outcome.state === 'PENDING') this.settleAt.set(ref, this.now() + SETTLE_AFTER_MS);
    return Promise.resolve(outcome);
  }

  status(ref: string): Promise<GatewayOutcome> {
    const at = this.settleAt.get(ref);
    if (at === undefined) return Promise.resolve({ state: 'FAILED', reason: 'CARD_DECLINED' });
    return Promise.resolve(this.now() >= at ? { state: 'SUCCEEDED' } : { state: 'PENDING' });
  }

  private decide(request: GatewayRequest): GatewayOutcome {
    if (request.method === 'WALLET') {
      const phone = request.wallet?.phone ?? '';
      if (phone === '0900000000') return { state: 'FAILED', reason: 'WALLET_DECLINED' };
      if (phone === '0900000001') return { state: 'PENDING' };
      return { state: 'SUCCEEDED' };
    }
    switch (request.card?.number.replace(/\s/g, '')) {
      case '4000000000000002':
        return { state: 'FAILED', reason: 'CARD_DECLINED' };
      case '4000000000009995':
        return { state: 'FAILED', reason: 'INSUFFICIENT_FUNDS' };
      case '4000000000000119':
        return { state: 'PENDING' };
      default:
        return { state: 'SUCCEEDED' };
    }
  }
}
