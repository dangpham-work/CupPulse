import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cardBrand, luhnValid, validateCard, validatePayment, validateWallet } from './payment';

const NOW = new Date('2026-11-14T00:00:00Z');

test('luhnValid: thẻ thử Stripe hợp lệ, số sai bị loại', () => {
  assert.equal(luhnValid('4242424242424242'), true);
  assert.equal(luhnValid('4000000000000002'), true);
  assert.equal(luhnValid('4242424242424241'), false);
  assert.equal(luhnValid('42424242abcd4242'), false);
});

test('validateCard: số thẻ, hạn dùng và CVV (AC-05.2)', () => {
  assert.deepEqual(validateCard({ number: '4242 4242 4242 4242', expMonth: 12, expYear: 2030, cvv: '123' }, NOW), {});
  assert.ok(validateCard({ number: '4242424242424241', expMonth: 12, expYear: 2030, cvv: '123' }, NOW)['card.number']);
  assert.ok(validateCard({ number: '4242424242424242', expMonth: 10, expYear: 2026, cvv: '123' }, NOW)['card.expMonth']);
  assert.deepEqual(validateCard({ number: '4242424242424242', expMonth: 11, expYear: 2026, cvv: '123' }, NOW), {});
  assert.ok(validateCard({ number: '4242424242424242', expMonth: 12, expYear: 2030, cvv: '12' }, NOW)['card.cvv']);
  assert.ok(validateCard(undefined, NOW).card);
});

test('validateWallet: số di động Việt Nam 10 chữ số', () => {
  assert.deepEqual(validateWallet({ phone: '0912345678' }), {});
  assert.ok(validateWallet({ phone: '0212345678' })['wallet.phone']);
  assert.ok(validateWallet({ phone: '091234567' })['wallet.phone']);
});

test('validatePayment: chọn nhánh theo phương thức', () => {
  assert.deepEqual(validatePayment({ method: 'WALLET', wallet: { phone: '0912345678' } }, NOW), {});
  assert.ok(validatePayment({ method: 'CARD' }, NOW).card);
  assert.ok(validatePayment({}, NOW).method);
});

test('cardBrand', () => {
  assert.equal(cardBrand('4242424242424242'), 'VISA');
  assert.equal(cardBrand('5555555555554444'), 'MASTERCARD');
});
