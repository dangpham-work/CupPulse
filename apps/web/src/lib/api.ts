import type { ApiError, ProductDetail, ProductSummary } from '@brewlite/shared';

/** Địa chỉ API, ví dụ http://localhost:4000 (local) hoặc https://brewlite-api.onrender.com (production). */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').replace(/\/$/, '');

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

export interface ApiOptions {
  method?: 'GET' | 'POST' | 'PATCH';
  body?: unknown;
  token?: string | null;
  headers?: Record<string, string>;
}

/** Kết quả kèm mã HTTP, dùng khi 201 và 202 có ý nghĩa khác nhau (thanh toán). */
export interface ApiResult<T> {
  status: number;
  data: T;
}

/** Gọi API, ném ApiRequestError khi không phải 2xx. Không bao giờ log body (có thể chứa số thẻ, BR-18). */
export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<ApiResult<T>> {
  const headers: Record<string, string> = { Accept: 'application/json', ...options.headers };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as Partial<ApiError> | null;
    throw new ApiRequestError(res.status, body?.code ?? 'HTTP_ERROR', body?.message ?? res.statusText, body?.details);
  }
  const data = (await res.json().catch(() => null)) as T;
  return { status: res.status, data };
}

async function getJson<T>(path: string): Promise<T> {
  return (await apiRequest<T>(path)).data;
}

/** GET /products – FR-01. */
export function fetchProducts(): Promise<ProductSummary[]> {
  return getJson<ProductSummary[]>('/products');
}

/** GET /products/:id – FR-02. */
export function fetchProduct(id: string): Promise<ProductDetail> {
  return getJson<ProductDetail>(`/products/${encodeURIComponent(id)}`);
}
