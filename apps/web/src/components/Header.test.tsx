import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { CartProvider } from '@/features/cart/CartProvider';
import { Header } from './Header';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

function mount(active = '/') {
  window.localStorage.clear();
  return render(
    <AuthProvider>
      <CartProvider>
        <Header active={active} />
      </CartProvider>
    </AuthProvider>,
  );
}

describe('Header – điều hướng nhiều trang', () => {
  it('menu chính có Trang chủ, Thực đơn, Về chúng tôi, Cửa hàng; khách chưa đăng nhập không thấy Đơn hàng/Quầy', () => {
    mount('/menu');
    const nav = screen.getByRole('navigation', { name: 'Điều hướng chính' });
    const links = within(nav).getAllByRole('link');
    expect(links.map((l) => l.textContent)).toEqual(['Trang chủ', 'Thực đơn', 'Về chúng tôi', 'Cửa hàng']);
    expect(within(nav).getByRole('link', { name: 'Thực đơn' })).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('link', { name: 'Cửa hàng' })).toHaveAttribute('href', '/stores');
  });

  it('nút ☰ mở và đóng danh sách trang trên di động', async () => {
    const user = userEvent.setup();
    mount();
    expect(screen.queryByRole('navigation', { name: 'Điều hướng trên di động' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Mở menu' }));
    const mobile = screen.getByRole('navigation', { name: 'Điều hướng trên di động' });
    expect(within(mobile).getByRole('link', { name: 'Về chúng tôi' })).toHaveAttribute('href', '/about');
    expect(screen.getByRole('button', { name: 'Đóng menu' })).toHaveAttribute('aria-expanded', 'true');

    await user.click(screen.getByRole('button', { name: 'Đóng menu' }));
    expect(screen.queryByRole('navigation', { name: 'Điều hướng trên di động' })).not.toBeInTheDocument();
  });
});
