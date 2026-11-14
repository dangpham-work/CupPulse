import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { StaffBoard } from './StaffBoard';

const replace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace }),
  usePathname: () => '/staff',
  useSearchParams: () => new URLSearchParams(),
}));

const order = (id: string, status: string, over: object = {}) => ({
  id, code: `BL-261114-000${id}`, callNumber: `000${id}`, status, subtotal: 0, discount: 0, total: 70000,
  expiresAt: '', createdAt: '2026-11-14T03:00:00.000Z', timeline: [], payment: null,
  items: [{ productId: 'p', productName: 'Latte', size: 'L', toppings: [{ id: 't', name: 'Kem cheese', price: 10000 }], note: 'ít đá', quantity: 2, unitPrice: 0, lineTotal: 0 }],
  ...over,
});
const json = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));

function mount(role: 'CUSTOMER' | 'STAFF' | 'MANAGER' | null) {
  window.localStorage.clear();
  if (role) window.localStorage.setItem('brewhouse.session.v1', JSON.stringify({ token: 'tok', user: { id: 'u', email: 'a@b.co', fullName: 'NV', role }, expiresAt: Date.now() + 3_600_000 }));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AuthProvider>
        <StaffBoard pollMs={50} />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => replace.mockReset());
afterEach(() => vi.unstubAllGlobals());

describe('StaffBoard (FR-12)', () => {
  it('CUSTOMER bị chặn ở giao diện và không gọi API (AC-11.4)', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    mount('CUSTOMER');

    expect(await screen.findByText('Bạn không có quyền xem trang này.')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('chưa đăng nhập: chuyển tới /login?returnUrl=/staff', async () => {
    vi.stubGlobal('fetch', vi.fn());
    mount(null);

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/login?returnUrl=%2Fstaff'));
  });

  it('chia đơn vào 3 cột theo trạng thái, hiện món, size, topping, ghi chú (AC-12.2)', async () => {
    vi.stubGlobal('fetch', vi.fn(() => json([order('1', 'PAID'), order('2', 'PREPARING'), order('3', 'READY')])));
    mount('STAFF');

    await screen.findByText('0001');
    const paid = screen.getByRole('region', { name: 'Đã thanh toán' });
    expect(within(paid).getByText('0001')).toBeInTheDocument();
    expect(within(paid).getByText(/2 × Latte/)).toBeInTheDocument();
    expect(within(paid).getByText(/Kem cheese/)).toBeInTheDocument();
    expect(within(paid).getByText(/ít đá/)).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Đang pha' })).getByText('0002')).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Sẵn sàng' })).getByText('0003')).toBeInTheDocument();
  });

  it('bấm nút đổi trạng thái gọi PATCH /staff/orders/:id/status rồi tải lại', async () => {
    const ID = '7f3c2a10-1b2c-4d5e-8f90-a1b2c3d4e5f6';
    const fetchMock = vi.fn((_u: RequestInfo | URL, init?: RequestInit) =>
      init?.method === 'PATCH' ? json(order(ID, 'PREPARING')) : json([order(ID, 'PAID')]),
    );
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    mount('MANAGER');

    await user.click(await screen.findByRole('button', { name: 'Bắt đầu pha' }));

    await waitFor(() => {
      const patch = fetchMock.mock.calls.find((c) => c[1]?.method === 'PATCH')!;
      expect(String(patch[0])).toMatch(new RegExp(`/staff/orders/${ID}/status$`));
      expect(JSON.parse(String(patch[1]!.body))).toEqual({ status: 'PREPARING' });
    });
  });
});
