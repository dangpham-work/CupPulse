import { expect, test } from '@playwright/test';

/**
 * E2E-T01: menu → chi tiết → giỏ → đăng ký → đăng nhập → thanh toán thẻ 4242… → xác nhận đơn.
 * Cần web + API + DB đã seed (docker compose up --build).
 */
test('khách đặt món và thanh toán thẻ thành công đến trang xác nhận đơn', async ({ page }) => {
  const email = `e2e-${Date.now()}@brewlite.test`;
  const password = 'Brewlite123';

  // 1. Menu → chi tiết → thêm vào giỏ (khách vãng lai dùng được giỏ, AC-03.5)
  await page.goto('/');
  await page.getByRole('link', { name: /Cà phê sữa đá/ }).first().click();
  await page.getByRole('button', { name: /Thêm vào giỏ/ }).click();
  await expect(page.getByRole('status')).toContainText('Đã thêm vào giỏ');

  // 2. Giỏ → Đặt hàng → bị chuyển sang đăng nhập, giỏ vẫn còn (AC-04.1)
  await page.goto('/cart');
  await expect(page.getByText('Cà phê sữa đá')).toBeVisible();
  await page.getByRole('link', { name: 'Đặt hàng' }).click();
  await expect(page).toHaveURL(/\/login\?returnUrl=%2Fcheckout/);

  // 3. Đăng ký rồi đăng nhập (returnUrl được giữ)
  await page.getByRole('link', { name: 'Đăng ký' }).click();
  // Trang đăng nhập cũng có ô Email/Mật khẩu: đợi chuyển hẳn sang /register rồi mới điền,
  // nếu không sẽ điền nhầm vào form đăng nhập đang chờ bị thay.
  await expect(page).toHaveURL(/\/register/);
  await expect(page.getByLabel('Họ tên')).toBeVisible();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Mật khẩu').fill(password);
  await page.getByLabel('Họ tên').fill('Khách E2E');
  await page.getByRole('button', { name: 'Tạo tài khoản' }).click();
  await expect(page.getByRole('status')).toContainText('Đăng ký thành công');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Mật khẩu').fill(password);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();

  // 4. Checkout: xác nhận đơn, trả bằng thẻ thử thành công
  await expect(page).toHaveURL(/\/checkout/);
  await page.getByRole('button', { name: 'Xác nhận đặt hàng' }).click();
  await page.getByLabel('Số thẻ').fill('4242424242424242');
  await page.getByLabel('Hết hạn (MM/YY)').fill('1230');
  await page.getByLabel('CVV').fill('123');
  await page.getByRole('button', { name: 'Thanh toán' }).click();

  // 5. Trang xác nhận: mã đơn BL-YYMMDD-NNNN, trạng thái đã thanh toán, thẻ •••• 4242
  await expect(page).toHaveURL(/\/orders\/[0-9a-f-]{36}/);
  await expect(page.getByText(/BL-\d{6}-\d{4}/)).toBeVisible();
  await expect(page.getByTestId('order-status')).toContainText('Đã thanh toán');
  await expect(page.getByText(/•••• 4242/)).toBeVisible();
});
