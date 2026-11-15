import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { OrderCta } from '@/features/home/HomeSections';
import { MenuView } from '@/features/menu/MenuView';

export const metadata: Metadata = { title: 'Thực đơn – Brew House' };

/** Route /menu: thực đơn đầy đủ (FR-01; Figma: 01 — Thực đơn). `?danh-muc=<slug>` mở sẵn một danh mục. */
export default async function MenuPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = (await searchParams)['danh-muc'];
  const category = typeof raw === 'string' ? raw : undefined;
  return (
    <>
      <Header active="/menu" />
      <main className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-10 md:py-12 lg:px-20">
        <MenuView initialCategory={category} />
      </main>
      <OrderCta />
    </>
  );
}
