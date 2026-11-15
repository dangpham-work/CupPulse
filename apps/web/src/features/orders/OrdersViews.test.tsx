import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { OrderDetailView } from './OrderDetailView';
import { OrderHistoryView } from './OrderHistoryView';

const replace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace }),
  usePathname: () => '/orders',
  useSearchParams: () => new URLSearchParams(),
}));

const ID = '7f3c2a10-1b2c-4d5e-8f90-a1b2c3d4e5f6';
const order = (over: object = {}) => ({
  id: ID, code: 'BL-261114-0007', callNumber: '0007', status: 'PAID', subtotal: 100000, discount: 0, total: 100000,
  expiresAt: '2026-11-14T03:15:00.000Z', createdAt: '2026-11-14T03:00:00.000Z',
  items: [{ productId: 'p1', productName: 'Cà phê sữa đá', size: 'L', toppings: [{ id: 't1', name: 'Trân châu', price: 5000 }], note: 'ít đá', quantity: 2, unitPrice: 50000, lineTotal: 100000 }],
  timeline: [{ status: 'PENDING_PAYMENT', at: '2026-11-14T03:00:00.000Z' }, { status: 'PAID', at: '2026-11-14T03:02:00.000Z' }],
  payment: { method: 'CARD', cardLast4: '4242' }, ...over,
});
const json = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));

function mount(ui: React.ReactElement) {
  window.localStorage.setItem('brewhouse.session.v1', JSON.stringify({ token: 'tok', user: { id: 'u1', email: 'a@b.co', fullName: 'An', role: 'CUSTOMER' }, expiresAt: Date.now() + 3_600_000 }));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AuthProvider>{ui}</AuthProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => { window.localStorage.clear(); replace.mockReset(); });
afterEach(() => vi.unstubAllGlobals());

describe('OrderDetailView (FR-07)', () => {
  it('hiện mã đơn, số gọi món, món, tổng, thẻ •••• 4242 và timeline (AC-07.1, AC-07.4)', async () => {
    vi.stubGlobal('fetch', vi.fn(() => json(order())));
    mount(<OrderDetailView id={ID} pollMs={50} />);

    expect(await screen.findByText('BL-261114-0007')).toBeInTheDocument();
    expect(screen.getByText('0007')).toBeInTheDocument();
    expect(screen.getByText(/2 × Cà phê sữa đá/)).toBeInTheDocument();
    expect(screen.getByText(/Trân châu/)).toBeInTheDocument();
    expect(screen.getByText('100.000 ₫', { selector: '[data-testid="order-total"]' })).toBeInTheDocument();
    expect(screen.getByText(/•••• 4242/)).toBeInTheDocument();
    expect(screen.getAllByText('Đã thanh toán').length).toBeGreaterThan(0);
    expect(screen.getByRole('list', { name: 'Dòng thời gian' }).children).toHaveLength(2);
  });

  it('polling cập nhật trạng thái mới và dừng khi hoàn tất (AC-07.3)', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => json(order()))
      .mockImplementationOnce(() => json(order({ status: 'READY' })))
      .mockImplementation(() => json(order({ status: 'COMPLETED' })));
    vi.stubGlobal('fetch', fetchMock);
    mount(<OrderDetailView id={ID} pollMs={20} />);

    expect(await screen.findByTestId('order-status')).toHaveTextContent('Đã thanh toán');
    await waitFor(() => expect(screen.getByTestId('order-status')).toHaveTextContent('Sẵn sàng nhận'));
    await waitFor(() => expect(screen.getByTestId('order-status')).toHaveTextContent('Hoàn tất'));
    const calls = fetchMock.mock.calls.length;
    await new Promise((r) => setTimeout(r, 120));
    expect(fetchMock.mock.calls.length).toBe(calls);
  });

  it('404 hiện "Không tìm thấy đơn hàng" (BR-17)', async () => {
    vi.stubGlobal('fetch', vi.fn(() => json({ statusCode: 404, code: 'ORDER_NOT_FOUND', message: 'x' }, 404)));
    mount(<OrderDetailView id={ID} pollMs={50} />);

    expect(await screen.findByText('Không tìm thấy đơn hàng.')).toBeInTheDocument();
  });

  it('đơn chờ thanh toán có nút thanh toán tiếp', async () => {
    vi.stubGlobal('fetch', vi.fn(() => json(order({ status: 'PENDING_PAYMENT', payment: null }))));
    mount(<OrderDetailView id={ID} pollMs={50} />);

    expect(await screen.findByRole('link', { name: 'Thanh toán ngay' })).toHaveAttribute('href', `/checkout?orderId=${ID}`);
  });
});

describe('OrderHistoryView (FR-08)', () => {
  const row = (i: number) => ({ id: `id${i}`, code: `BL-261114-000${i}`, status: 'PAID', total: 50000 * i, cups: i, createdAt: '2026-11-14T03:00:00.000Z' });

  it('chưa có đơn: "Bạn chưa có đơn nào" và nút Xem menu (AC-08.3)', async () => {
    vi.stubGlobal('fetch', vi.fn(() => json({ items: [], total: 0, page: 1, limit: 10 })));
    mount(<OrderHistoryView />);

    expect(await screen.findByText('Bạn chưa có đơn nào')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Xem menu' })).toHaveAttribute('href', '/menu');
  });

  it('liệt kê đơn và phân trang gọi đúng page/limit (AC-08.1, AC-08.2)', async () => {
    const fetchMock = vi.fn((_u: RequestInfo | URL) => json({ items: [row(1), row(2)], total: 12, page: 1, limit: 10 }));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    mount(<OrderHistoryView />);

    expect(await screen.findByRole('link', { name: /BL-261114-0001/ })).toHaveAttribute('href', '/orders/id1');
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/orders\?page=1&limit=10$/);
    await user.click(screen.getByRole('button', { name: 'Trang sau' }));
    await waitFor(() => expect(String(fetchMock.mock.calls.at(-1)![0])).toMatch(/page=2&limit=10$/));
  });
});
