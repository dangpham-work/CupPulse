import { describe, expect, it } from 'vitest';
import { ApiRequestError } from './api';
import { MAX_RETRIES, retryDelay, shouldRetry } from './queryRetry';

describe('shouldRetry – chờ API Render free khởi động lại (cold start ~60 giây)', () => {
  it('thử lại lỗi mạng (fetch bị chặn khi API đang ngủ)', () => {
    expect(shouldRetry(0, new TypeError('Failed to fetch'))).toBe(true);
  });

  it('thử lại lỗi 5xx từ proxy Render (502/503) và 429', () => {
    expect(shouldRetry(2, new ApiRequestError(502, 'HTTP_ERROR', 'Bad Gateway'))).toBe(true);
    expect(shouldRetry(2, new ApiRequestError(503, 'HTTP_ERROR', 'Service Unavailable'))).toBe(true);
    expect(shouldRetry(2, new ApiRequestError(429, 'HTTP_ERROR', 'Too Many Requests'))).toBe(true);
  });

  it('không thử lại lỗi 4xx của nghiệp vụ (404, 401, 400)', () => {
    expect(shouldRetry(0, new ApiRequestError(404, 'NOT_FOUND', 'Không tìm thấy'))).toBe(false);
    expect(shouldRetry(0, new ApiRequestError(401, 'UNAUTHORIZED', 'Chưa đăng nhập'))).toBe(false);
    expect(shouldRetry(0, new ApiRequestError(400, 'VALIDATION_ERROR', 'Sai dữ liệu'))).toBe(false);
  });

  it('dừng sau MAX_RETRIES lần', () => {
    expect(shouldRetry(MAX_RETRIES - 1, new TypeError('Failed to fetch'))).toBe(true);
    expect(shouldRetry(MAX_RETRIES, new TypeError('Failed to fetch'))).toBe(false);
  });

  it('tổng thời gian chờ đủ phủ một lần cold start (≥ 75 giây) và mỗi lần không quá 15 giây', () => {
    let total = 0;
    for (let i = 0; i < MAX_RETRIES; i++) {
      const d = retryDelay(i);
      expect(d).toBeGreaterThan(0);
      expect(d).toBeLessThanOrEqual(15_000);
      total += d;
    }
    expect(total).toBeGreaterThanOrEqual(75_000);
  });
});
