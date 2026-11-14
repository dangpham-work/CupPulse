import type { ApiError, ProductSummary } from '@brewlite/shared';

/** Địa chỉ API, ví dụ http://localhost:4000 (local) hoặc https://brewlite-api.onrender.com (production). */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').replace(/\/$/, '');

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}/api/v1${path}`, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as Partial<ApiError> | null;
    throw new ApiRequestError(res.status, body?.code ?? 'HTTP_ERROR', body?.message ?? res.statusText);
  }
  return (await res.json()) as T;
}

/** GET /products – FR-01. */
export function fetchProducts(): Promise<ProductSummary[]> {
  return getJson<ProductSummary[]>('/products');
}
