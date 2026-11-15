import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { CartProvider, useCart, type CartLine } from './CartProvider';
import { CartView } from './CartView';

type NewLine = Omit<CartLine, 'id'>;
const base: NewLine = {
  productId: 'p1',
  name: 'Cà phê sữa đá',
  imageUrl: '/images/menu/coffee.svg',
  size: 'M',
  toppingIds: [],
  toppingNames: [],
  note: '',
  qty: 1,
  unitPrice: 40000,
};

function Seed({ lines }: { lines: NewLine[] }) {
  const cart = useCart();
  return <button onClick={() => lines.forEach((l) => cart.add(l))}>seed</button>;
}

async function renderCart(lines: NewLine[] = []) {
  const user = userEvent.setup();
  render(
    <CartProvider>
      <Seed lines={lines} />
      <CartView />
    </CartProvider>,
  );
  if (lines.length) await user.click(screen.getByText('seed'));
  return user;
}

beforeEach(() => window.localStorage.clear());

describe('CartView (FR-03)', () => {
  it('giỏ rỗng: hiện "Giỏ hàng trống" và nút Đặt hàng bị vô hiệu (AC-03.6)', async () => {
    await renderCart();
    expect(screen.getByText('Giỏ hàng trống')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /đặt hàng/i })).toBeDisabled();
  });

  it('tính tạm tính theo BR-02, BR-04 và bật nút Đặt hàng (AC-03.3)', async () => {
    await renderCart([{ ...base, qty: 2 }, { ...base, productId: 'p2', name: 'Trà đào', unitPrice: 45000 }]);
    expect(screen.getByTestId('subtotal')).toHaveTextContent('125.000');
    expect(screen.getByRole('link', { name: /đặt hàng/i })).toHaveAttribute('href', '/checkout');
  });

  it('gộp cùng sản phẩm/size/topping/ghi chú vào một dòng (AC-03.2)', async () => {
    await renderCart([base, base]);
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByLabelText('Số lượng Cà phê sữa đá')).toHaveTextContent('2');
  });

  it('tăng/giảm số lượng trong 1–10 và xóa dòng (AC-03.3)', async () => {
    const user = await renderCart([base]);
    await user.click(screen.getByRole('button', { name: 'Tăng số lượng Cà phê sữa đá' }));
    expect(screen.getByTestId('subtotal')).toHaveTextContent('80.000');
    await user.click(screen.getByRole('button', { name: 'Giảm số lượng Cà phê sữa đá' }));
    await user.click(screen.getByRole('button', { name: 'Giảm số lượng Cà phê sữa đá' }));
    expect(screen.getByLabelText('Số lượng Cà phê sữa đá')).toHaveTextContent('1');
    await user.click(screen.getByRole('button', { name: 'Xóa Cà phê sữa đá' }));
    expect(screen.getByText('Giỏ hàng trống')).toBeInTheDocument();
  });

  it('không cho vượt 20 ly và báo lỗi (AC-03.7)', async () => {
    const user = await renderCart([{ ...base, qty: 10 }, { ...base, productId: 'p2', name: 'Trà', qty: 10 }]);
    await user.click(screen.getByRole('button', { name: 'Tăng số lượng Trà' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/tối đa 20 ly|tối đa 10 ly/i);
    expect(screen.getByLabelText('Số lượng Trà')).toHaveTextContent('10');
  });

  it('giỏ giữ nguyên sau khi tải lại trang (AC-03.4)', async () => {
    await renderCart([base]);
    render(
      <CartProvider>
        <CartView />
      </CartProvider>,
    );
    expect(await screen.findAllByText('Cà phê sữa đá')).toHaveLength(2);
  });
});
