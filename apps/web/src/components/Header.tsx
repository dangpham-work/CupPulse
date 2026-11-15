'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/features/auth/AuthProvider';
import { CartCount } from './CartCount';

interface NavItem {
  href: string;
  label: string;
  /** Vai trò được thấy mục này; bỏ trống = mọi người (AC-11.4). Server vẫn chặn truy cập trực tiếp. */
  roles?: string[];
}

const NAV: NavItem[] = [
  { href: '/', label: 'Trang chủ' },
  { href: '/menu', label: 'Thực đơn' },
  { href: '/about', label: 'Về chúng tôi' },
  { href: '/stores', label: 'Cửa hàng' },
  { href: '/orders', label: 'Đơn hàng của tôi', roles: ['CUSTOMER', 'STAFF', 'MANAGER'] },
  { href: '/staff', label: 'Quầy', roles: ['STAFF', 'MANAGER'] },
];

/**
 * Header dùng chung (Figma: component Header). Từ lg hiện đủ menu ngang;
 * màn nhỏ hơn có nút ☰ mở danh sách trang bên dưới header.
 */
export function Header({ active = '/' }: { active?: string }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const items = NAV.filter((item) => !item.roles || (user && item.roles.includes(user.role)));
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white">
      <div className="flex h-[72px] items-center justify-between gap-3 px-4 md:px-10 lg:px-20">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="Brew House – trang chủ">
          <span className="flex size-9 items-center justify-center rounded-[10px] bg-brand text-lg font-bold text-white">B</span>
          <span className="whitespace-nowrap text-xl font-bold text-brand">Brew House</span>
        </Link>

        <nav aria-label="Điều hướng chính" className="hidden items-center gap-7 text-[15px] lg:flex">
          {items.map((item) => (
            <NavLink key={item.href} item={item} active={active} />
          ))}
        </nav>

        <div className="flex items-center gap-2 md:gap-4">
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
              <span className="hidden max-w-[140px] truncate text-sm font-medium text-ink xl:inline">{user.fullName}</span>
              <button type="button" onClick={logout} className="hidden min-h-11 items-center whitespace-nowrap rounded-[10px] border border-line px-[18px] text-sm font-semibold text-brand sm:flex">
                Đăng xuất
              </button>
            </>
          ) : (
            <Link href="/login" className="hidden min-h-11 items-center whitespace-nowrap rounded-[10px] bg-brand px-4 text-sm font-semibold text-white sm:flex md:px-[18px]">
              Đăng nhập
            </Link>
          )}
          <button
            type="button"
            className="flex size-11 items-center justify-center rounded-[10px] border border-line text-brand lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Đóng menu' : 'Mở menu'}
            onClick={() => setOpen((v) => !v)}
          >
            <MenuIcon open={open} />
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Điều hướng trên di động" className="border-t border-line bg-white px-4 pb-4 pt-2 md:px-10 lg:hidden">
          <ul className="flex flex-col">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={item.href === active ? 'page' : undefined}
                  className={`flex min-h-12 items-center border-b border-line/70 text-base ${
                    item.href === active ? 'font-semibold text-brand' : 'font-medium text-ink'
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            {user ? (
              <li className="sm:hidden">
                <button type="button" onClick={logout} className="flex min-h-12 w-full items-center text-base font-medium text-muted">
                  Đăng xuất
                </button>
              </li>
            ) : (
              <li className="pt-3 sm:hidden">
                <Link href="/login" onClick={() => setOpen(false)} className="flex min-h-12 items-center justify-center rounded-[10px] bg-brand text-base font-semibold text-white">
                  Đăng nhập
                </Link>
              </li>
            )}
          </ul>
        </nav>
      )}
    </header>
  );
}

function NavLink({ item, active }: { item: NavItem; active: string }) {
  const current = item.href === active;
  return (
    <Link
      href={item.href}
      aria-current={current ? 'page' : undefined}
      className={`whitespace-nowrap ${current ? 'font-semibold text-brand' : 'font-medium text-muted hover:text-brand'}`}
    >
      {item.label}
    </Link>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      {open ? <path d="m5 5 10 10M15 5 5 15" /> : <path d="M3 5.5h14M3 10h14M3 14.5h14" />}
    </svg>
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
