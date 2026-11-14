import { MockGateway } from './mock-gateway';

describe('MockGateway (UNIT – ADR-005, FR-05)', () => {
  const gateway = new MockGateway(() => 1_000);
  const card = (number: string) => ({ method: 'CARD' as const, amount: 50000, card: { number } });
  const wallet = (phone: string) => ({ method: 'WALLET' as const, amount: 50000, wallet: { phone } });

  it('thẻ 4242… thành công', async () => {
    expect(await gateway.charge('p1', card('4242424242424242'))).toEqual({ state: 'SUCCEEDED' });
  });

  it('thẻ 4000…0002 bị từ chối CARD_DECLINED, 4000…9995 INSUFFICIENT_FUNDS', async () => {
    expect(await gateway.charge('p2', card('4000000000000002'))).toEqual({ state: 'FAILED', reason: 'CARD_DECLINED' });
    expect(await gateway.charge('p3', card('4000000000009995'))).toEqual({ state: 'FAILED', reason: 'INSUFFICIENT_FUNDS' });
  });

  it('ví 0900000000 bị từ chối, ví khác thành công', async () => {
    expect(await gateway.charge('p4', wallet('0900000000'))).toEqual({ state: 'FAILED', reason: 'WALLET_DECLINED' });
    expect(await gateway.charge('p5', wallet('0912345678'))).toEqual({ state: 'SUCCEEDED' });
  });

  it('thẻ 4000…0119 trả PENDING rồi chốt thành công sau 5 giây (AC-05.7)', async () => {
    let now = 1_000;
    const g = new MockGateway(() => now);

    expect(await g.charge('p6', card('4000000000000119'))).toEqual({ state: 'PENDING' });
    expect(await g.status('p6')).toEqual({ state: 'PENDING' });
    now += 5_000;
    expect(await g.status('p6')).toEqual({ state: 'SUCCEEDED' });
  });

  it('đếm số lần gọi để kiểm chứng idempotency (AC-06.2)', async () => {
    const g = new MockGateway(() => 0);

    await g.charge('p7', card('4242424242424242'));
    await g.charge('p8', card('4242424242424242'));

    expect(g.calls).toBe(2);
  });
});
