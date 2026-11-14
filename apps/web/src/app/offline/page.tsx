import Link from 'next/link';

export const metadata = { title: 'Mất kết nối – Brew House' };

/** Trang hiển thị khi mất mạng (service worker trả về cho mọi điều hướng thất bại). */
export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-bold text-ink">Bạn đang offline</h1>
      <p className="text-muted">Không có kết nối mạng. Vui lòng kiểm tra Wi-Fi hoặc 4G rồi thử lại.</p>
      <Link href="/" className="inline-flex min-h-11 items-center rounded-[10px] bg-brand px-6 text-sm font-semibold text-white">
        Thử lại
      </Link>
    </main>
  );
}
