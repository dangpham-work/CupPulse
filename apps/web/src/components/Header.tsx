'use client';

import Link from 'next/link';
import { useAuth } from '@/features/auth/AuthProvider';
import { CartCount } from './CartCount';

interface NavItem {
  href: string;
  label: string;
  /** Vai trò được thấy mục này; bỏ trống = mọi người (AC-11.4). Server vẫn chặn truy cập trực tiếp. */
  roles?: string[];
}

const NAV: NavItem[] = [
  { href: '/', label: 'Thực đơn' },
  { href: '/orders', label: 'Đơn hàng của tôi', roles: ['CUSTOMER', 'STAFF', 'MANAGER'] },
  { href: '/staff', label: 'Quầy', roles: ['STAFF', 'MANAGER'] },
];

/** Header dùng chung (Figma: component Header, trạng thái Guest). Mobile: ẩn nav, chỉ giữ logo + giỏ + đăng nhập. */
export function Header({ active = '/' }: { active?: string }) {
  const { user, logout } = useAuth();
  const items = NAV.filter((item) => !item.roles || (user && item.roles.includes(user.role)));
  return (
    <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-line bg-white px-4 md:px-10 lg:px-20">
      <Link href="/" className="flex items-center gap-2.5" aria-label="Brew House – trang chủ">
        <span className="flex size-9 items-center justify-center rounded-[10px] bg-brand text-lg font-bold text-white">B</span>
        <span className="text-xl font-bold text-brand">Brew House</span>
      </Link>

      <nav aria-label="Điều hướng chính" className="hidden items-center gap-8 text-[15px] md:flex">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={item.href === active ? 'page' : undefined}
            className={item.href === active ? 'font-semibold text-brand' : 'font-medium text-muted hover:text-brand'}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-3 md:gap-4">
        <Link
          href="/cart"
          className="flex min-h-11 items-center gap-2 rounded-[10px] bg-tint px-3.5 text-sm font-semibold text-brand"
        >
          <BagIcon />
          <span className="hidden sm:inline">Giỏ hàng</span>
          <CartCount />
        </Link>
        {user ? (
          <>
            <span className="hidden max-w-[140px] truncate text-sm font-medium text-ink lg:inline">{user.fullName}</span>
            <button type="button" onClick={logout} className="flex min-h-11 items-center rounded-[10px] border border-line px-[18px] text-sm font-semibold text-brand">
              Đăng xuất
            </button>
          </>
        ) : (
          <Link href="/login" className="flex min-h-11 items-center rounded-[10px] bg-brand px-[18px] text-sm font-semibold text-white">
            Đăng nhập
          </Link>
        )}
      </div>
    </header>
  );
}

function BagIcon() {
  return (
    <svg width="16" height="17" viewBox="0 0 16 17" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 5.5h11l-.9 9.5H3.4L2.5 5.5Z" />
      <path d="M5.5 5.5V4a2.5 2.5 0 0 1 5 0v1.5" />
    </svg>
  );
}
