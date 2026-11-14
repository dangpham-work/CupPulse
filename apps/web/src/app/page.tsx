import { Header } from '@/components/Header';
import { MenuView } from '@/features/menu/MenuView';

/** Trang chủ = menu (SRS mục 9, route "/"). Figma: 01 — Thực đơn (Menu). */
export default function HomePage() {
  return (
    <>
      <Header active="/" />
      <main className="mx-auto max-w-[1440px] px-4 py-8 md:px-10 md:py-12 lg:px-20">
        <MenuView />
      </main>
    </>
  );
}
