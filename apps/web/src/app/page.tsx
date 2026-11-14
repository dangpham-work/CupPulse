import { MenuView } from '@/features/menu/MenuView';

/** Trang chủ = menu (SRS mục 9, route "/"). */
export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl">
      <header className="sticky top-0 z-10 bg-stone-50/95 px-4 pb-3 pt-5 backdrop-blur">
        <p className="text-sm font-medium text-brew-700">BrewLite</p>
        <h1 className="text-2xl font-bold">Hôm nay uống gì?</h1>
      </header>
      <MenuView />
    </main>
  );
}
