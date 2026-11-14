import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatVnd } from './format';

test('formatVnd hiển thị dạng 45.000 ₫ (SRS 1.3)', () => {
  assert.equal(formatVnd(45000), '45.000 ₫');
});

test('formatVnd xử lý số 0 và số lớn', () => {
  assert.equal(formatVnd(0), '0 ₫');
  assert.equal(formatVnd(1250000), '1.250.000 ₫');
});
