/** Hợp đồng dữ liệu của API catalog (SRS AC-01.1, AC-02.1). */
export type SizeCode = 'S' | 'M' | 'L';

export interface CategoryRef {
  id: string;
  name: string;
  slug: string;
}

export interface ProductSummary {
  id: string;
  name: string;
  imageUrl: string;
  basePrice: number;
  category: CategoryRef;
  inStock: boolean;
}

export interface ProductSize {
  code: SizeCode;
  name: string;
  extraPrice: number;
}

export interface ProductTopping {
  id: string;
  name: string;
  price: number;
}

export interface ProductDetail extends ProductSummary {
  description: string;
  sizes: ProductSize[];
  toppings: ProductTopping[];
}

/** Định dạng lỗi thống nhất của API (SRS 1.3). */
export interface ApiError {
  statusCode: number;
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
