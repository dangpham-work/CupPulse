import Link from 'next/link';

/** Chân trang dùng chung: thương hiệu, liên kết, liên hệ, giờ mở cửa. Thông tin liên hệ là dữ liệu minh họa cho đồ án. */
export function Footer() {
  return (
    <footer className="mt-auto bg-ink text-tint/80">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-12 sm:grid-cols-2 md:px-10 lg:grid-cols-4 lg:px-20">
        <div className="flex flex-col gap-3">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Brew House – trang chủ">
            <span className="flex size-9 items-center justify-center rounded-[10px] bg-accent text-lg font-bold text-white">B</span>
            <span className="text-xl font-bold text-white">Brew House</span>
          </Link>
          <p className="text-sm leading-relaxed">
            Cà phê phin, trà trái cây và bánh nướng mỗi sáng. Đặt trước trên điện thoại, nhận ngay tại quầy.
          </p>
        </div>

        <nav aria-label="Liên kết chân trang" className="flex flex-col gap-2.5 text-sm">
          <p className="mb-1 font-semibold uppercase tracking-wider text-white">Khám phá</p>
          <Link href="/menu" className="hover:text-white">Thực đơn</Link>
          <Link href="/about" className="hover:text-white">Về chúng tôi</Link>
          <Link href="/stores" className="hover:text-white">Cửa hàng & liên hệ</Link>
          <Link href="/orders" className="hover:text-white">Đơn hàng của tôi</Link>
          <Link href="/register" className="hover:text-white">Tạo tài khoản</Link>
        </nav>

        <div className="flex flex-col gap-2.5 text-sm">
          <p className="mb-1 font-semibold uppercase tracking-wider text-white">Liên hệ</p>
          <p>123 Đường Cà Phê, TP. Hồ Chí Minh (địa chỉ minh họa)</p>
          <p>Hotline: 1900 0000 (minh họa)</p>
          <p>Email: hello@brewhouse.example</p>
        </div>

        <div className="flex flex-col gap-2.5 text-sm">
          <p className="mb-1 font-semibold uppercase tracking-wider text-white">Giờ mở cửa</p>
          <p className="flex justify-between gap-4"><span>Thứ 2 – Thứ 6</span><span className="text-white">6:30 – 22:00</span></p>
          <p className="flex justify-between gap-4"><span>Thứ 7 – Chủ nhật</span><span className="text-white">7:00 – 22:30</span></p>
          <Link href="/stores" className="mt-2 rounded-xl border border-white/15 px-3 py-2 text-xs leading-relaxed hover:border-white/40 hover:text-white">
            Cách đặt món & câu hỏi thường gặp →
          </Link>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-[1440px] px-4 py-5 text-xs md:px-10 lg:px-20">
          © 2026 Brew House · Đồ án môn Công nghệ Phần mềm, Trường Đại học Sài Gòn. Ảnh món minh họa tạo bằng AI.
        </p>
      </div>
    </footer>
  );
}
