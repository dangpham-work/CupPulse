import { Header } from '@/components/Header';
import { FeaturedProducts } from '@/features/home/FeaturedProducts';
import { AnnouncementBar, CategoryTiles, Hero, Highlights, OrderCta, Story } from '@/features/home/HomeSections';

/** Trang chủ: banner, điểm nổi bật, món bán chạy, danh mục, câu chuyện rút gọn, kêu gọi đăng ký. Thực đơn đầy đủ ở /menu. */
export default function HomePage() {
  return (
    <>
      <AnnouncementBar />
      <Header active="/" />
      <main>
        <Hero />
        <Highlights />
        <FeaturedProducts />
        <CategoryTiles />
        <Story teaser />
        <OrderCta />
      </main>
    </>
  );
}
