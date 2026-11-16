import { ApiRequestError } from './api';

/**
 * API chạy trên Render gói free: ngủ sau ~15 phút không có request, lần gọi đầu phải đợi khởi động lại
 * (~60 giây). Trong lúc đó fetch lỗi mạng hoặc nhận 502/503 từ proxy. Thử lại với backoff để người dùng
 * thấy khung "đang tải" thay vì báo lỗi ngay. Lỗi 4xx là lỗi nghiệp vụ, không thử lại.
 */
export const MAX_RETRIES = 8;

export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_RETRIES) return false;
  if (error instanceof ApiRequestError) return error.status >= 500 || error.status === 429;
  return true;
}

/** 1s, 2s, 4s, 8s rồi 15s mỗi lần: tổng 8 lần ≈ 75 giây. */
export function retryDelay(attempt: number): number {
  return Math.min(1_000 * 2 ** attempt, 15_000);
}
