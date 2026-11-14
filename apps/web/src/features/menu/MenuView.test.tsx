import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ProductSummary } from '@brewlite/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MenuView } from './MenuView';

const coffee = { id: 'c1', name: 'Cà phê', slug: 'ca-phe' };
const tea = { id: 'c2', name: 'Trà', slug: 'tra' };
const products: ProductSummary[] = [
  { id: 'p1', name: 'Cà phê sữa đá', imageUrl: '/images/menu/coffee.svg', basePrice: 35000, category: coffee, inStock: true },
  { id: 'p2', name: 'Cold brew', imageUrl: '/images/menu/coffee.svg', basePrice: 49000, category: coffee, inStock: false },
  { id: 'p3', name: 'Trà đào', imageUrl: '/images/menu/tea.svg', basePrice: 45000, category: tea, inStock: true },
];

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));
}

function renderMenu() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MenuView />
    </QueryClientProvider>,
  );
}

afterEach(() => vi.unstubAllGlobals());

describe('MenuView (FR-01, AC-01.3, AC-01.4)', () => {
  it('hiện skeleton khi đang tải rồi hiện danh sách món', async () => {
    vi.stubGlobal('fetch', vi.fn(() => jsonResponse(products)));

    renderMenu();

    expect(screen.getByTestId('menu-skeleton')).toBeInTheDocument();
    expect(await screen.findByText('Cà phê sữa đá')).toBeInTheDocument();
    expect(screen.getByText('35.000 ₫')).toBeInTheDocument();
    expect(screen.queryByTestId('menu-skeleton')).not.toBeInTheDocument();
  });

  it('gọi đúng endpoint GET /api/v1/products', async () => {
    const fetchMock = vi.fn((_input: RequestInfo | URL) => jsonResponse(products));
    vi.stubGlobal('fetch', fetchMock);

    renderMenu();
    await screen.findByText('Cà phê sữa đá');

    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/api\/v1\/products$/);
  });

  it('hiện "Chưa có món nào" khi danh sách rỗng', async () => {
    vi.stubGlobal('fetch', vi.fn(() => jsonResponse([])));

    renderMenu();

    expect(await screen.findByText('Chưa có món nào')).toBeInTheDocument();
  });

  it('hiện lỗi và nút "Thử lại"; bấm thì gọi lại API', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => jsonResponse({ statusCode: 500, code: 'INTERNAL_ERROR', message: 'Lỗi hệ thống' }, 500))
      .mockImplementationOnce(() => jsonResponse(products));
    vi.stubGlobal('fetch', fetchMock);

    renderMenu();
    const retry = await screen.findByRole('button', { name: 'Thử lại' });
    expect(screen.getByRole('alert')).toHaveTextContent('Không tải được menu');

    await userEvent.click(retry);

    expect(await screen.findByText('Cà phê sữa đá')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('hiện lỗi khi mất mạng', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))));

    renderMenu();

    expect(await screen.findByRole('button', { name: 'Thử lại' })).toBeInTheDocument();
  });

  it('món hết hàng có nhãn "Hết hàng" (AC-01.4)', async () => {
    vi.stubGlobal('fetch', vi.fn(() => jsonResponse(products)));

    renderMenu();

    const card = (await screen.findByText('Cold brew')).closest('article')!;
    expect(within(card).getByText('Hết hàng')).toBeInTheDocument();
    const available = screen.getByText('Trà đào').closest('article')!;
    expect(within(available).queryByText('Hết hàng')).not.toBeInTheDocument();
  });

  it('lọc theo tab danh mục', async () => {
    vi.stubGlobal('fetch', vi.fn(() => jsonResponse(products)));
    renderMenu();
    await screen.findByText('Trà đào');

    await userEvent.click(screen.getByRole('tab', { name: 'Trà' }));

    await waitFor(() => expect(screen.queryByText('Cà phê sữa đá')).not.toBeInTheDocument());
    expect(screen.getByText('Trà đào')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Trà' })).toHaveAttribute('aria-selected', 'true');
  });
});
