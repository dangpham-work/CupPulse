'use client';

import { useCart } from '@/features/cart/CartProvider';

/** Badge số món trên nút giỏ hàng ở Header. */
export function CartCount() {
  const { count } = useCart();
  return (
    <span aria-label={`${count} món trong giỏ`} className="rounded-full bg-accent px-[7px] py-px text-xs font-bold text-white">
      {count}
    </span>
  );
}
