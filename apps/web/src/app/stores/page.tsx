import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { OrderCta, PageBanner, SectionHeading } from '@/features/home/HomeSections';

export const metadata: Metadata = { title: 'Cửa hàng & liên hệ – Brew House' };

/** Thông tin cửa hàng là dữ liệu minh họa của đồ án. */
const STORE = {
  name: 'Brew House – Quầy trung tâm',
  address: '123 Đường Cà Phê, TP. Hồ Chí Minh (địa chỉ minh họa)',
  phone: '1900 0000 (minh họa)',
  email: 'hello@brewhouse.example',
  hours: [
    ['Thứ 2 – Thứ 6', '6:30 – 22:00'],
    ['Thứ 7 – Chủ nhật', '7:00 – 22:30'],
  ],
  services: ['Mang đi', 'Đặt trước qua ứng dụng', 'Thanh toán thẻ / ví', 'Nhận tại quầy'],
};

const STEPS = [
  { title: 'Chọn món', text: 'Mở Thực đơn, chọn size, topping và thêm vào giỏ.' },
  { title: 'Đăng nhập', text: 'Đăng nhập hoặc tạo tài khoản bằng email trong vài giây.' },
  { title: 'Thanh toán', text: 'Trả bằng thẻ hoặc ví điện tử; kết quả hiện ngay.' },
  { title: 'Nhận ly', text: 'Theo dõi trạng thái; đến quầy khi đơn báo “Sẵn sàng nhận”.' },
];

/** Câu trả lời bám theo quy tắc nghiệp vụ đã hiện thực (BR-08, BR-09, BR-12, BR-18). */
const FAQ = [
  {
    q: 'Đơn chưa thanh toán được giữ bao lâu?',
    a: 'Sau khi đặt, món được giữ 15 phút để bạn thanh toán. Quá thời gian này đơn tự hủy và món được trả lại kho.',
  },
  {
    q: 'Thanh toán thất bại thì sao?',
    a: 'Bạn có thể thử lại ngay trên trang thanh toán. Nếu thất bại 3 lần, đơn sẽ bị hủy để bảo vệ tài khoản của bạn; bạn không bị trừ tiền.',
  },
  {
    q: 'Làm sao biết ly của tôi đã xong?',
    a: 'Vào “Đơn hàng của tôi”: trạng thái đổi lần lượt Đã thanh toán → Đang pha chế → Sẵn sàng nhận → Hoàn tất khi nhân viên cập nhật.',
  },
  {
    q: 'Tôi đổi ý thì làm sao?',
    a: 'Nếu chưa thanh toán, bạn chỉ cần bỏ qua đơn: sau 15 phút đơn tự hủy. Đơn đã thanh toán đã được chuyển cho quầy pha chế, vui lòng liên hệ nhân viên tại quầy.',
  },
  {
    q: 'Brew House có lưu số thẻ của tôi không?',
    a: 'Không. Hệ thống chỉ lưu 4 số cuối để bạn đối chiếu, không lưu số thẻ đầy đủ hay CVV.',
  },
];

/** Route /stores: thông tin cửa hàng, cách đặt món, câu hỏi thường gặp. */
export default function StoresPage() {
  return (
    <>
      <Header active="/stores" />
      <main>
        <PageBanner
          eyebrow="Cửa hàng & liên hệ"
          title="Ghé Brew House hoặc đặt trước trên điện thoại"
          intro="Thông tin quầy, giờ mở cửa và mọi điều bạn cần biết để đặt món nhanh nhất."
        />

        <section aria-labelledby="store-title" className="mx-auto grid w-full max-w-[1440px] gap-6 px-4 py-12 md:px-10 md:py-16 lg:grid-cols-[1.2fr_1fr] lg:px-20">
          <article className="rounded-3xl border border-line bg-white p-6 md:p-8">
            <h2 id="store-title" className="text-2xl font-bold text-ink">{STORE.name}</h2>
            <dl className="mt-5 grid gap-4 text-[15px] sm:grid-cols-2">
              <div>
                <dt className="text-sm font-semibold text-muted">Địa chỉ</dt>
                <dd className="mt-1 text-ink">{STORE.address}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-muted">Hotline</dt>
                <dd className="mt-1 text-ink">{STORE.phone}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-muted">Email</dt>
                <dd className="mt-1 text-ink">{STORE.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-muted">Giờ mở cửa</dt>
                {STORE.hours.map(([d, h]) => (
                  <dd key={d} className="mt-1 flex justify-between gap-4 text-ink"><span>{d}</span><span className="font-semibold">{h}</span></dd>
                ))}
              </div>
            </dl>
            <ul className="mt-6 flex flex-wrap gap-2" aria-label="Dịch vụ">
              {STORE.services.map((s) => (
                <li key={s} className="rounded-full bg-tint px-3 py-1.5 text-sm font-medium text-brand">{s}</li>
              ))}
            </ul>
            <Link href="/menu" className="mt-7 inline-flex min-h-12 items-center rounded-xl bg-brand px-6 font-semibold text-white">
              Đặt trước tại quầy này
            </Link>
          </article>

          <div className="relative flex min-h-[260px] flex-col justify-end overflow-hidden rounded-3xl bg-ink p-6 md:p-8" aria-hidden="true">
            <MapArt />
            <p className="relative text-sm text-tint/80">Bản đồ minh họa</p>
            <p className="relative text-lg font-semibold text-white">Quầy trung tâm · mang đi</p>
          </div>
        </section>

        <section aria-labelledby="steps-title" className="bg-white">
          <div className="mx-auto w-full max-w-[1440px] px-4 py-12 md:px-10 md:py-16 lg:px-20">
            <SectionHeading id="steps-title" eyebrow="Đặt món" title="4 bước để nhận ly không cần xếp hàng" />
            <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s, i) => (
                <li key={s.title} className="flex gap-4 rounded-2xl bg-cream p-5">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand font-bold text-white">{i + 1}</span>
                  <div>
                    <h3 className="font-semibold text-ink">{s.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="faq-title" className="mx-auto w-full max-w-[960px] px-4 py-12 md:px-10 md:py-16">
          <SectionHeading id="faq-title" eyebrow="Hỏi đáp" title="Câu hỏi thường gặp" />
          <div className="mt-8 flex flex-col gap-3">
            {FAQ.map((f) => (
              <details key={f.q} className="group rounded-2xl border border-line bg-white px-5 py-4 open:shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink">
                  {f.q}
                  <span className="text-xl text-accent transition group-open:rotate-45" aria-hidden="true">+</span>
                </summary>
                <p className="mt-3 text-[15px] leading-relaxed text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <OrderCta />
      </main>
    </>
  );
}

/** Bản đồ cách điệu (không gọi dịch vụ bản đồ bên ngoài). */
function MapArt() {
  return (
    <svg className="absolute inset-0 size-full" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
      <rect width="400" height="300" fill="#3a2418" />
      <g stroke="#5a3b2a" strokeWidth="14" fill="none" strokeLinecap="round">
        <path d="M-10 80 H420" />
        <path d="M-10 210 Q200 170 420 230" />
        <path d="M120 -10 V310" />
        <path d="M300 -10 Q270 150 320 310" />
      </g>
      <g stroke="#4a3022" strokeWidth="5" fill="none">
        <path d="M-10 140 H420" />
        <path d="M200 -10 V310" />
        <path d="M40 -10 L90 310" />
      </g>
      <circle cx="200" cy="140" r="34" fill="#c8773a" opacity="0.25" />
      <path d="M200 112c-11 0-20 9-20 20 0 15 20 34 20 34s20-19 20-34c0-11-9-20-20-20Z" fill="#c8773a" />
      <circle cx="200" cy="132" r="7" fill="#fff" />
    </svg>
  );
}
