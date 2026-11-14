'use client';

import type { SizeCode } from '@brewlite/shared';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

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

interface CartValue {
  lines: CartLine[];
  count: number;
  add: (line: Omit<CartLine, 'id'>) => void;
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

/** Giỏ hàng phía client, lưu localStorage (không bắt buộc – lỗi lưu trữ thì giỏ chỉ sống trong phiên). */
export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLines(load());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* bỏ qua: private mode / hết dung lượng */
    }
  }, [lines, ready]);

  const add = useCallback((line: Omit<CartLine, 'id'>) => {
    setLines((prev) => {
      const id = [line.productId, line.size, [...line.toppingIds].sort().join('+'), line.note].join('|');
      const same = prev.find((l) => l.id === id);
      if (same) return prev.map((l) => (l.id === id ? { ...l, qty: l.qty + line.qty } : l));
      return [...prev, { ...line, id }];
    });
  }, []);

  const value = useMemo<CartValue>(
    () => ({ lines, count: lines.reduce((n, l) => n + l.qty, 0), add }),
    [lines, add],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart phải nằm trong <CartProvider>');
  return ctx;
}
