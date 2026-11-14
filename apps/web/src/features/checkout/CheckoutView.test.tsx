import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { CartProvider } from '@/features/cart/CartProvider';
import { CheckoutView } from './CheckoutView';

const push = vi.fn();
const replace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace }),
  usePathname: () => '/checkout',
  useSearchParams: () => new URLSearchParams(),
}));

const ORDER_ID = '7f3c2a10-1b2c-4d5e-8f90-a1b2c3d4e5f6';
const line = { id: 'l1', productId: 'p1', name: 'Cà phê sữa đá', imageUrl: '/i.svg', size: 'M', toppingIds: [], toppingNames: [], note: '', qty: 2, unitPrice: 40000 };
const order = (over: object = {}) => ({
  id: ORDER_ID, code: 'BL-261114-0001', callNumber: '0001', status: 'PENDING_PAYMENT', subtotal: 80000, discount: 0, total: 80000,
  expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(), createdAt: new Date().toISOString(), items: [], timeline: [], payment: null, ...over,
});
const json = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));

function seed(withSession = true, withCart = true) {
  window.localStorage.clear();
  if (withSession) {
    window.localStorage.setItem('brewhouse.session.v1', JSON.stringify({ token: 'tok', user: { id: 'u1', email: 'a@b.co', fullName: 'An', role: 'CUSTOMER' }, expiresAt: Date.now() + 3_600_000 }));
  }
  if (withCart) window.localStorage.setItem('brewhouse.cart.v1', JSON.stringify([line]));
}

function renderCheckout(props: { orderId?: string } = {}) {
  return render(
    <AuthProvider>
      <CartProvider>
        <CheckoutView pollMs={5} {...props} />
      </CartProvider>
    </AuthProvider>,
  );
}

async function fillCard(user: ReturnType<typeof userEvent.setup>, number = '4242424242424242') {
  await user.type(screen.getByLabelText('Số thẻ'), number);
  await user.type(screen.getByLabelText('Hết hạn (MM/YY)'), '1230');
  await user.type(screen.getByLabelText('CVV'), '123');
  await user.click(screen.getByRole('button', { name: 'Thanh toán' }));
}

type Call = { url: string; init: RequestInit };
function route(handlers: Record<string, () => Promise<Response>>) {
  const calls: Call[] = [];
  const fn = vi.fn((input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = String(input).replace(/^.*\/api\/v1/, '');
    calls.push({ url, init });
    const key = `${init.method ?? 'GET'} ${url}`;
    const h = handlers[key];
    if (!h) return json({ statusCode: 500, code: 'X', message: `unhandled ${key}` }, 500);
    return h();
  });
  vi.stubGlobal('fetch', fn);
  return calls;
}

beforeEach(() => { push.mockReset(); replace.mockReset(); });
afterEach(() => vi.unstubAllGlobals());

describe('CheckoutView (FR-04, FR-05, FR-06)', () => {
  it('chưa đăng nhập: chuyển tới /login?returnUrl=/checkout và giữ nguyên giỏ (AC-04.1)', async () => {
    seed(false, true);
    route({});
    renderCheckout();

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/login?returnUrl=%2Fcheckout'));
    expect(window.localStorage.getItem('brewhouse.cart.v1')).toContain('Cà phê sữa đá');
  });

  it('đặt đơn gửi expectedTotal, xóa giỏ rồi hiện bước thanh toán (AC-04.8)', async () => {
    seed();
    const calls = route({ 'POST /orders': () => json(order(), 201) });
    const user = userEvent.setup();
    renderCheckout();

    await user.click(await screen.findByRole('button', { name: 'Xác nhận đặt hàng' }));

    expect(await screen.findByRole('button', { name: 'Thanh toán' })).toBeInTheDocument();
    const body = JSON.parse(String(calls[0].init.body));
    expect(body.expectedTotal).toBe(80000);
    expect(body.items[0]).toEqual({ productId: 'p1', size: 'M', toppingIds: [], note: '', quantity: 2 });
    expect((calls[0].init.headers as Record<string, string>).Authorization).toBe('Bearer tok');
    await waitFor(() => expect(window.localStorage.getItem('brewhouse.cart.v1')).toBe('[]'));
  });

  it('409 PRICE_CHANGED hiện giá mới và không tạo đơn (AC-04.3)', async () => {
    seed();
    route({ 'POST /orders': () => json({ statusCode: 409, code: 'PRICE_CHANGED', message: 'Giá đã thay đổi', details: { total: 90000 } }, 409) });
    const user = userEvent.setup();
    renderCheckout();

    await user.click(await screen.findByRole('button', { name: 'Xác nhận đặt hàng' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('90.000');
    expect(screen.getByRole('button', { name: 'Đồng ý giá mới và đặt hàng' })).toBeInTheDocument();
    expect(window.localStorage.getItem('brewhouse.cart.v1')).toContain('Cà phê sữa đá');
  });

  it('409 OUT_OF_STOCK nêu tên món hết hàng (AC-04.5)', async () => {
    seed();
    route({ 'POST /orders': () => json({ statusCode: 409, code: 'OUT_OF_STOCK', message: 'x', details: { productIds: ['p1'] } }, 409) });
    const user = userEvent.setup();
    renderCheckout();

    await user.click(await screen.findByRole('button', { name: 'Xác nhận đặt hàng' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Cà phê sữa đá');
  });

  it('thanh toán thẻ thành công: gửi Idempotency-Key UUID, không lưu thẻ, chuyển tới /orders/:id (AC-05.4, AC-06.1)', async () => {
    seed();
    const calls = route({
      'POST /orders': () => json(order(), 201),
      'POST /payments': () => json({ paymentId: 'pay1', status: 'SUCCEEDED', orderStatus: 'PAID' }, 201),
    });
    const user = userEvent.setup();
    renderCheckout();
    await user.click(await screen.findByRole('button', { name: 'Xác nhận đặt hàng' }));
    await fillCard(user);

    await waitFor(() => expect(push).toHaveBeenCalledWith(`/orders/${ORDER_ID}`));
    const pay = calls.find((c) => c.url === '/payments')!;
    const headers = pay.init.headers as Record<string, string>;
    expect(headers['Idempotency-Key']).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(JSON.parse(String(pay.init.body))).toEqual({
      orderId: ORDER_ID, method: 'CARD', card: { number: '4242424242424242', expMonth: 12, expYear: 2030, cvv: '123' },
    });
    expect(JSON.stringify({ ...window.localStorage })).not.toContain('4242');
  });

  it('thẻ sai Luhn bị chặn ở client, không gọi /payments (AC-05.2)', async () => {
    seed();
    const calls = route({ 'POST /orders': () => json(order(), 201) });
    const user = userEvent.setup();
    renderCheckout();
    await user.click(await screen.findByRole('button', { name: 'Xác nhận đặt hàng' }));
    await fillCard(user, '4242424242424241');

    expect(await screen.findByText('Số thẻ không hợp lệ')).toBeInTheDocument();
    expect(calls.some((c) => c.url === '/payments')).toBe(false);
  });

  it('402 PAYMENT_FAILED hiện lý do tiếng Việt; lần bấm sau dùng khóa mới (AC-05.5)', async () => {
    seed();
    const calls = route({
      'POST /orders': () => json(order(), 201),
      'POST /payments': () => json({ statusCode: 402, code: 'PAYMENT_FAILED', message: 'x', details: { reason: 'CARD_DECLINED' } }, 402),
    });
    const user = userEvent.setup();
    renderCheckout();
    await user.click(await screen.findByRole('button', { name: 'Xác nhận đặt hàng' }));
    await fillCard(user, '4000000000000002');

    expect(await screen.findByRole('alert')).toHaveTextContent('Thẻ bị từ chối');
    await user.click(screen.getByRole('button', { name: 'Thanh toán' }));
    await waitFor(() => expect(calls.filter((c) => c.url === '/payments')).toHaveLength(2));
    const keys = calls.filter((c) => c.url === '/payments').map((c) => (c.init.headers as Record<string, string>)['Idempotency-Key']);
    expect(keys[0]).not.toBe(keys[1]);
  });

  it('202 PENDING: hiện "Đang xử lý" và gửi lại cùng Idempotency-Key tới khi có kết quả (AC-05.7)', async () => {
    seed();
    let n = 0;
    const calls = route({
      'POST /orders': () => json(order(), 201),
      'POST /payments': () =>
        ++n < 3
          ? json({ paymentId: 'pay1', status: 'PENDING', orderStatus: 'PENDING_PAYMENT' }, 202)
          : json({ paymentId: 'pay1', status: 'SUCCEEDED', orderStatus: 'PAID' }, 201),
    });
    const user = userEvent.setup();
    renderCheckout();
    await user.click(await screen.findByRole('button', { name: 'Xác nhận đặt hàng' }));
    await fillCard(user, '4000000000000119');

    await waitFor(() => expect(push).toHaveBeenCalledWith(`/orders/${ORDER_ID}`));
    const keys = calls.filter((c) => c.url === '/payments').map((c) => (c.init.headers as Record<string, string>)['Idempotency-Key']);
    expect(keys).toHaveLength(3);
    expect(new Set(keys).size).toBe(1);
  });

  it('ORDER_NOT_PAYABLE báo đơn đã hủy/hết hạn (AC-05.3)', async () => {
    seed();
    route({
      'POST /orders': () => json(order(), 201),
      'POST /payments': () => json({ statusCode: 409, code: 'ORDER_NOT_PAYABLE', message: 'x' }, 409),
    });
    const user = userEvent.setup();
    renderCheckout();
    await user.click(await screen.findByRole('button', { name: 'Xác nhận đặt hàng' }));
    await fillCard(user);

    expect(await screen.findByRole('alert')).toHaveTextContent(/hết hạn|đã bị hủy/);
  });

  it('có orderId: tải đơn đang chờ thanh toán và vào thẳng bước thanh toán', async () => {
    seed(true, false);
    route({ [`GET /orders/${ORDER_ID}`]: () => json(order()) });
    renderCheckout({ orderId: ORDER_ID });

    expect(await screen.findByRole('button', { name: 'Thanh toán' })).toBeInTheDocument();
    expect(screen.getByText(/BL-261114-0001/)).toBeInTheDocument();
  });
});
