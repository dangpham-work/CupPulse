import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from './AuthProvider';
import { LoginView } from './LoginView';
import { RegisterView } from './RegisterView';

const push = vi.fn();
const replace = vi.fn();
let search = '';
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace }),
  usePathname: () => '/login',
  useSearchParams: () => new URLSearchParams(search),
}));

function json(body: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));
}

const wrap = (ui: React.ReactElement) => render(<AuthProvider>{ui}</AuthProvider>);

beforeEach(() => {
  window.localStorage.clear();
  push.mockReset();
  replace.mockReset();
  search = '';
});
afterEach(() => vi.unstubAllGlobals());

describe('LoginView (FR-10)', () => {
  it('validate phía client, không gọi API khi sai định dạng', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    wrap(<LoginView />);

    await user.type(screen.getByLabelText('Email'), 'khong-phai-email');
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    expect(await screen.findByText('Email không hợp lệ')).toBeInTheDocument();
    expect(screen.getByText('Vui lòng nhập mật khẩu')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('đăng nhập đúng: lưu token và chuyển tới returnUrl (AC-04.1)', async () => {
    search = 'returnUrl=%2Fcheckout';
    const fetchMock = vi.fn(() =>
      json({ accessToken: 'tok', expiresIn: 3600, user: { id: 'u1', email: 'a@b.co', fullName: 'An', role: 'CUSTOMER' } }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    wrap(<LoginView />);

    await user.type(screen.getByLabelText('Email'), 'a@b.co');
    await user.type(screen.getByLabelText('Mật khẩu'), 'matkhau123');
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/checkout'));
    expect(window.localStorage.getItem('brewhouse.session.v1')).toContain('tok');
  });

  it('INVALID_CREDENTIALS hiện thông báo chung (AC-10.2)', async () => {
    vi.stubGlobal('fetch', vi.fn(() => json({ statusCode: 401, code: 'INVALID_CREDENTIALS', message: 'Email hoặc mật khẩu không đúng' }, 401)));
    const user = userEvent.setup();
    wrap(<LoginView />);

    await user.type(screen.getByLabelText('Email'), 'a@b.co');
    await user.type(screen.getByLabelText('Mật khẩu'), 'sai-mat-khau1');
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Email hoặc mật khẩu không đúng');
    expect(replace).not.toHaveBeenCalled();
  });
});

describe('RegisterView (FR-09)', () => {
  it('báo lỗi từng trường theo AC-09.2', async () => {
    vi.stubGlobal('fetch', vi.fn());
    const user = userEvent.setup();
    wrap(<RegisterView />);

    await user.type(screen.getByLabelText('Email'), 'a@b.co');
    await user.type(screen.getByLabelText('Mật khẩu'), 'abcdefgh');
    await user.type(screen.getByLabelText('Họ tên'), 'A');
    await user.type(screen.getByLabelText('Số điện thoại (không bắt buộc)'), '0212345678');
    await user.click(screen.getByRole('button', { name: 'Tạo tài khoản' }));

    expect(await screen.findByText('Mật khẩu tối thiểu 8 ký tự, gồm chữ và số')).toBeInTheDocument();
    expect(screen.getByText('Họ tên từ 2 đến 50 ký tự')).toBeInTheDocument();
    expect(screen.getByText(/số di động Việt Nam/)).toBeInTheDocument();
  });

  it('EMAIL_TAKEN hiện ở trường email; thành công thì chuyển tới /login giữ returnUrl', async () => {
    search = 'returnUrl=%2Fcheckout';
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => json({ statusCode: 409, code: 'EMAIL_TAKEN', message: 'Email đã được đăng ký' }, 409))
      .mockImplementationOnce(() => json({ id: 'u1', email: 'a@b.co', fullName: 'An Nguyen', role: 'CUSTOMER' }, 201));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    wrap(<RegisterView />);

    await user.type(screen.getByLabelText('Email'), 'a@b.co');
    await user.type(screen.getByLabelText('Mật khẩu'), 'matkhau123');
    await user.type(screen.getByLabelText('Họ tên'), 'An Nguyen');
    await user.click(screen.getByRole('button', { name: 'Tạo tài khoản' }));
    expect(await screen.findByText('Email đã được đăng ký')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Tạo tài khoản' }));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/login?registered=1&returnUrl=%2Fcheckout'));
  });
});
