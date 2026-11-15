import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

const CONTAINER = 'mx-auto w-full max-w-[1440px] px-4 md:px-10 lg:px-20';

/** Dải thông báo mảnh trên cùng trang chủ. */
export function AnnouncementBar() {
  return (
    <div className="bg-ink px-4 py-2 text-center text-xs font-medium text-tint md:text-[13px]">
      Mở cửa mỗi ngày 6:30 – 22:00 · Đặt trước trên điện thoại, đến quầy nhận ngay không cần xếp hàng
    </div>
  );
}

/** Banner đầu trang chủ: ảnh lớn, tiêu đề, hai nút hành động. */
export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden bg-ink">
      <Image
        src="/images/hero.webp"
        alt="Quầy Brew House với cà phê sữa đá, trà đào, matcha latte và bánh croissant"
        fill
        priority
        sizes="100vw"
        className="-z-10 object-cover object-right"
        unoptimized
      />
      <div className="absolute inset-0 -z-10 bg-ink/75 md:bg-transparent md:bg-gradient-to-r md:from-ink/90 md:via-ink/60 md:to-ink/0" aria-hidden="true" />
      <div className={`${CONTAINER} flex min-h-[420px] flex-col justify-center gap-5 py-14 md:min-h-[520px]`}>
        <span className="self-start rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
          Pha mới mỗi ngày
        </span>
        <h1 id="hero-title" className="max-w-[560px] text-[34px] font-bold leading-tight text-white md:text-5xl md:leading-[1.15]">
          Cà phê phin chuẩn vị Việt, sẵn sàng sau 5 phút
        </h1>
        <p className="max-w-[480px] text-base leading-relaxed text-tint/90 md:text-lg">
          Chọn món, tùy chỉnh size và topping, thanh toán ngay trên điện thoại. Brew House báo bạn khi ly đã sẵn sàng ở quầy.
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
          <Link href="/menu" className="flex min-h-12 items-center rounded-xl bg-accent px-6 text-[15px] font-semibold text-white transition hover:brightness-110">
            Đặt món ngay
          </Link>
          <Link
            href="/about"
            className="flex min-h-12 items-center rounded-xl border border-white/60 px-6 text-[15px] font-semibold text-white transition hover:bg-white/10"
          >
            Về Brew House
          </Link>
        </div>
      </div>
    </section>
  );
}

/** Banner nhỏ đầu các trang phụ (Về chúng tôi, Cửa hàng). */
export function PageBanner({ eyebrow, title, intro }: { eyebrow: string; title: string; intro: string }) {
  return (
    <section className="relative isolate overflow-hidden bg-ink">
      <Image src="/images/hero.webp" alt="" fill sizes="100vw" className="-z-10 object-cover opacity-40" unoptimized />
      <div className={`${CONTAINER} flex flex-col gap-3 py-14 md:py-20`}>
        <span className="text-sm font-semibold uppercase tracking-wider text-accent">{eyebrow}</span>
        <h1 className="max-w-[720px] text-[32px] font-bold leading-tight text-white md:text-[44px]">{title}</h1>
        <p className="max-w-[620px] text-base leading-relaxed text-tint/90 md:text-lg">{intro}</p>
      </div>
    </section>
  );
}

const HIGHLIGHTS: { title: string; text: string; icon: ReactNode }[] = [
  { title: 'Cà phê phin truyền thống', text: 'Robusta Đắk Lắk rang mộc, pha phin chậm từng ly.', icon: <CupIcon /> },
  { title: 'Đặt trước, khỏi xếp hàng', text: 'Đặt trên điện thoại, đến quầy là có ly của bạn.', icon: <ClockIcon /> },
  { title: 'Thanh toán an toàn', text: 'Thẻ hoặc ví điện tử; không lưu số thẻ của bạn.', icon: <ShieldIcon /> },
  { title: 'Theo dõi đơn trực tiếp', text: 'Biết ngay khi đơn được nhận, đang pha và sẵn sàng.', icon: <BellIcon /> },
];

/** Bốn điểm nổi bật của quán. */
export function Highlights() {
  return (
    <section aria-label="Điểm nổi bật" className="border-b border-line bg-white">
      <ul className={`${CONTAINER} grid grid-cols-1 gap-6 py-8 sm:grid-cols-2 lg:grid-cols-4`}>
        {HIGHLIGHTS.map((h) => (
          <li key={h.title} className="flex items-start gap-3.5">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-tint text-brand">{h.icon}</span>
            <div>
              <p className="font-semibold text-ink">{h.title}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-muted">{h.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

const CATEGORY_TILES = [
  { slug: 'ca-phe', name: 'Cà phê', note: 'Phin, bạc xỉu, latte, cold brew', image: '/images/menu/ca-phe-sua-da.webp' },
  { slug: 'tra', name: 'Trà', note: 'Trà trái cây, trà sữa, matcha', image: '/images/menu/tra-dao-cam-sa.webp' },
  { slug: 'da-xay', name: 'Đá xay', note: 'Mát lạnh, phủ kem tươi', image: '/images/menu/socola-da-xay.webp' },
  { slug: 'banh', name: 'Bánh', note: 'Nướng mới mỗi sáng', image: '/images/menu/croissant-bo.webp' },
];

/** Ô danh mục dẫn tới trang Thực đơn đã lọc sẵn. */
export function CategoryTiles() {
  return (
    <section aria-labelledby="cat-title" className={`${CONTAINER} py-12 md:py-16`}>
      <SectionHeading id="cat-title" eyebrow="Khám phá" title="Hôm nay bạn muốn uống gì?" />
      <ul className="mt-8 grid grid-cols-2 gap-3 md:gap-6 lg:grid-cols-4">
        {CATEGORY_TILES.map((c) => (
          <li key={c.slug}>
            <Link
              href={`/menu?danh-muc=${c.slug}`}
              className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-3xl bg-tint p-4 md:p-6"
            >
              <Image src={c.image} alt="" fill sizes="(min-width: 1024px) 25vw, 50vw" className="-z-0 object-cover object-[50%_40%] transition duration-500 group-hover:scale-105" unoptimized />
              <span className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" aria-hidden="true" />
              <span className="relative text-xl font-bold text-white md:text-2xl">{c.name}</span>
              <span className="relative mt-1 text-xs text-tint/90 md:text-sm">{c.note}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

const STATS = [
  { value: '16 giờ', label: 'ủ lạnh cho mỗi mẻ cold brew' },
  { value: '5 phút', label: 'từ lúc đặt tới khi nhận ly' },
  { value: '12+', label: 'món cà phê, trà và bánh' },
];

/** Khối câu chuyện thương hiệu. `teaser` = bản rút gọn ở trang chủ, có nút sang trang Về chúng tôi. */
export function Story({ teaser = false }: { teaser?: boolean }) {
  return (
    <section aria-labelledby="story-title" className="bg-tint/60">
      <div className={`${CONTAINER} grid items-center gap-10 py-14 md:py-20 lg:grid-cols-2 lg:gap-16`}>
        <div className="relative aspect-square w-full overflow-hidden rounded-3xl shadow-lg">
          <Image src="/images/story.webp" alt="Nhân viên Brew House đang pha cà phê phin" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" unoptimized />
        </div>
        <div className="flex flex-col gap-5">
          <span className="text-sm font-semibold uppercase tracking-wider text-accent">Câu chuyện của chúng tôi</span>
          <h2 id="story-title" className="text-3xl font-bold leading-tight text-ink md:text-4xl">
            Từ hạt cà phê Tây Nguyên đến ly cà phê trên tay bạn
          </h2>
          <p className="text-base leading-relaxed text-muted">
            Brew House bắt đầu là một quầy cà phê mang đi nhỏ giữa lòng thành phố. Chúng tôi chọn hạt Robusta và Arabica
            từ nông trại Đắk Lắk, Lâm Đồng, rang vừa mỗi tuần để giữ hương thơm, rồi pha phin chậm theo cách người Sài Gòn
            vẫn uống mỗi sáng.
          </p>
          {!teaser && (
            <p className="text-base leading-relaxed text-muted">
              Ứng dụng đặt món ra đời để bạn không phải chờ: đặt trước, thanh toán trong vài giây và theo dõi từng bước pha
              chế cho tới khi ly sẵn sàng ở quầy.
            </p>
          )}
          <dl className="mt-2 grid grid-cols-3 gap-4 border-t border-line pt-6">
            {STATS.map((s) => (
              <div key={s.label}>
                <dt className="sr-only">{s.label}</dt>
                <dd className="text-2xl font-bold text-brand md:text-3xl">{s.value}</dd>
                <dd className="mt-1 text-xs leading-snug text-muted md:text-sm">{s.label}</dd>
              </div>
            ))}
          </dl>
          {teaser && (
            <Link href="/about" className="mt-2 self-start rounded-xl border border-brand px-6 py-3 text-[15px] font-semibold text-brand transition hover:bg-brand hover:text-white">
              Đọc câu chuyện đầy đủ
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

const VALUES = [
  { title: 'Hạt cà phê Việt', text: 'Chỉ dùng hạt từ nông trại Tây Nguyên, mua trực tiếp và rang vừa mỗi tuần.', icon: <LeafIcon /> },
  { title: 'Pha đúng chuẩn', text: 'Mỗi ly theo công thức cố định: định lượng, nhiệt độ nước và thời gian nhỏ giọt.', icon: <CupIcon /> },
  { title: 'Nhanh mà không vội', text: 'Đặt trước để chúng tôi có đủ thời gian pha chậm, còn bạn không phải chờ.', icon: <ClockIcon /> },
];

/** Giá trị cốt lõi (trang Về chúng tôi). */
export function Values() {
  return (
    <section aria-labelledby="values-title" className={`${CONTAINER} py-14 md:py-20`}>
      <SectionHeading id="values-title" eyebrow="Điều chúng tôi tin" title="Ba giá trị trong mỗi ly" />
      <ul className="mt-8 grid gap-4 md:grid-cols-3 md:gap-6">
        {VALUES.map((v) => (
          <li key={v.title} className="rounded-3xl border border-line bg-white p-6 md:p-8">
            <span className="flex size-12 items-center justify-center rounded-full bg-tint text-brand">{v.icon}</span>
            <h3 className="mt-4 text-lg font-semibold text-ink">{v.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{v.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

const PROCESS = [
  { step: '01', title: 'Chọn hạt', text: 'Robusta và Arabica chín đỏ, phơi và sơ chế tại nông trại.' },
  { step: '02', title: 'Rang mộc', text: 'Rang vừa mỗi tuần, không tẩm bơ hay hương liệu.' },
  { step: '03', title: 'Xay & pha phin', text: 'Xay ngay trước khi pha, nhỏ giọt chậm 4–5 phút.' },
  { step: '04', title: 'Trao tận tay', text: 'Ly sẵn sàng ở quầy đúng lúc ứng dụng báo bạn.' },
];

/** Quy trình từ hạt tới ly (trang Về chúng tôi). */
export function Process() {
  return (
    <section aria-labelledby="process-title" className="bg-white">
      <div className={`${CONTAINER} py-14 md:py-20`}>
        <SectionHeading id="process-title" eyebrow="Hành trình" title="Từ nông trại tới quầy" />
        <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PROCESS.map((p) => (
            <li key={p.step} className="relative border-t-2 border-accent pt-5">
              <span className="text-3xl font-bold text-accent/70">{p.step}</span>
              <h3 className="mt-2 text-lg font-semibold text-ink">{p.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{p.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** Khối kêu gọi cuối trang. */
export function OrderCta() {
  return (
    <section className={`${CONTAINER} py-14`}>
      <div className="flex flex-col items-start gap-5 rounded-3xl bg-brand px-6 py-10 text-white md:flex-row md:items-center md:justify-between md:px-12">
        <div>
          <h2 className="text-2xl font-bold md:text-3xl">Lần đầu ghé Brew House?</h2>
          <p className="mt-2 max-w-[520px] text-tint/90">Tạo tài khoản để đặt món, thanh toán nhanh và xem lại lịch sử đơn bất cứ lúc nào.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/menu" className="flex min-h-12 shrink-0 items-center rounded-xl bg-white px-6 font-semibold text-brand transition hover:bg-tint">
            Xem thực đơn
          </Link>
          <Link href="/register" className="flex min-h-12 shrink-0 items-center rounded-xl border border-white/60 px-6 font-semibold text-white transition hover:bg-white/10">
            Đăng ký miễn phí
          </Link>
        </div>
      </div>
    </section>
  );
}

export function SectionHeading({ id, eyebrow, title, action }: { id: string; eyebrow: string; title: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <span className="text-sm font-semibold uppercase tracking-wider text-accent">{eyebrow}</span>
        <h2 id={id} className="mt-1 text-[28px] font-bold leading-tight text-ink md:text-4xl">{title}</h2>
      </div>
      {action}
    </div>
  );
}

function CupIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9Z" />
      <path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17" />
      <path d="M8 3c0 1.5 1 1.5 1 3M12 3c0 1.5 1 1.5 1 3" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  );
}

function LeafIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14H5Z" />
      <path d="M5 19 13 11" />
    </svg>
  );
}
