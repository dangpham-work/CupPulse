/** Hợp đồng dữ liệu đơn hàng và thanh toán (SRS FR-04 → FR-08). */
import type { SizeCode } from './product';

export type OrderStatus = 'PENDING_PAYMENT' | 'PAID' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
export type PaymentMethod = 'CARD' | 'WALLET';

export const MAX_CUPS_PER_ORDER = 20; // BR-03
export const MAX_QTY_PER_LINE = 10; // BR-03
export const MAX_TOPPINGS_PER_LINE = 3; // BR-03
export const MAX_NOTE_LENGTH = 100; // BR-03

export interface CreateOrderItemInput {
  productId: string;
  size: SizeCode;
  toppingIds: string[];
  note?: string;
  quantity: number;
}

export interface CreateOrderInput {
  items: CreateOrderItemInput[];
  /** Tổng client đang hiển thị; lệch với server thì 409 PRICE_CHANGED (BR-05). */
  expectedTotal?: number;
}

export interface OrderItemView {
  productId: string;
  productName: string;
  size: SizeCode;
  toppings: { id: string; name: string; price: number }[];
  note: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface OrderView {
  id: string;
  code: string;
  /** Số gọi món NNNN hiển thị ở quầy (BR-16). */
  callNumber: string;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  total: number;
  expiresAt: string;
  createdAt: string;
  items: OrderItemView[];
  timeline: { status: OrderStatus; at: string }[];
  payment: { method: PaymentMethod; cardLast4: string | null } | null;
}

export interface OrderListItem {
  id: string;
  code: string;
  status: OrderStatus;
  total: number;
  cups: number;
  createdAt: string;
}

export interface OrderPage {
  items: OrderListItem[];
  total: number;
  page: number;
  limit: number;
}

/** Luồng trạng thái hợp lệ (BR-12). */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ['PAID', 'CANCELLED'],
  PAID: ['PREPARING'],
  PREPARING: ['READY'],
  READY: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};
