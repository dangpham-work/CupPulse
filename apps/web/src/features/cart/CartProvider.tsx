'use client';

import { MAX_CUPS_PER_ORDER, MAX_QTY_PER_LINE, type SizeCode } from '@brewlite/shared';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

export interface CartLine {
  id: string;
  productId: string;
  name: string;
  imageUrl: string;
  size: SizeCode;
  toppingIds: string[];
  toppingNames: string[];
  note: string;
  qty: number;
  /** Đơn giá một ly đã gồm size + topping, tính lúc thêm vào giỏ. Server vẫn tính lại khi đặt hàng. */
  unitPrice: number;
}

export type AddResult = { ok: true } | { ok: false; reason: 'TOO_MANY_CUPS' | 'LINE_LIMIT' };

interface CartValue {
  lines: CartLine[];
  /** Tổng số ly. */
  count: number;
  /** Tạm tính = Σ đơn giá × số lượng (BR-04). */
  subtotal: number;
  add: (line: Omit<CartLine, 'id'>) => AddResult;
  setQty: (id: string, qty: number) => AddResult;
  remove: (id: string) => void;
  clear: () => void;
}

const STORAGE_KEY = 'brewhouse.cart.v1';
const CartContext = createContext<CartValue | null>(null);

function load(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartLine[]) : [];
  } catch {
    return [];
  }
}

const cupsOf = (lines: CartLine[]) => lines.reduce((n, l) => n + l.qty, 0);

/** Giỏ hàng phía client, lưu localStorage (không bắt buộc – lỗi lưu trữ thì giỏ chỉ sống trong phiên). */
export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  /** Bản sao đồng bộ của giỏ để nhiều thao tác liên tiếp trong một sự kiện không đọc trạng thái cũ. */
  const ref = useRef<CartLine[]>([]);
  const commit = useCallback((next: CartLine[]) => {
    ref.current = next;
    setLines(next);
  }, []);

  useEffect(() => {
    commit(load());
    setReady(true);
  }, [commit]);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* bỏ qua: private mode / hết dung lượng */
    }
  }, [lines, ready]);

  const add = useCallback(
    (line: Omit<CartLine, 'id'>): AddResult => {
      const id = [line.productId, line.size, [...line.toppingIds].sort().join('+'), line.note].join('|');
      const lines = ref.current;
      const same = lines.find((l) => l.id === id);
      const newQty = (same?.qty ?? 0) + line.qty;
      if (newQty > MAX_QTY_PER_LINE) return { ok: false, reason: 'LINE_LIMIT' };
      if (cupsOf(lines) + line.qty > MAX_CUPS_PER_ORDER) return { ok: false, reason: 'TOO_MANY_CUPS' };
      commit(same ? lines.map((l) => (l.id === id ? { ...l, qty: newQty } : l)) : [...lines, { ...line, id }]);
      return { ok: true };
    },
    [commit],
  );

  const setQty = useCallback(
    (id: string, qty: number): AddResult => {
      const lines = ref.current;
      const target = lines.find((l) => l.id === id);
      if (!target || qty < 1) return { ok: true };
      if (qty > MAX_QTY_PER_LINE) return { ok: false, reason: 'LINE_LIMIT' };
      if (cupsOf(lines) - target.qty + qty > MAX_CUPS_PER_ORDER) return { ok: false, reason: 'TOO_MANY_CUPS' };
      commit(lines.map((l) => (l.id === id ? { ...l, qty } : l)));
      return { ok: true };
    },
    [commit],
  );

  const remove = useCallback((id: string) => commit(ref.current.filter((l) => l.id !== id)), [commit]);
  const clear = useCallback(() => commit([]), [commit]);

  const value = useMemo<CartValue>(
    () => ({
      lines,
      count: cupsOf(lines),
      subtotal: lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0),
      add,
      setQty,
      remove,
      clear,
    }),
    [lines, add, setQty, remove, clear],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart phải nằm trong <CartProvider>');
  return ctx;
}

export const CART_LIMIT_MESSAGES = {
  TOO_MANY_CUPS: `Một đơn tối đa ${MAX_CUPS_PER_ORDER} ly.`,
  LINE_LIMIT: `Mỗi dòng tối đa ${MAX_QTY_PER_LINE} ly.`,
} as const;
