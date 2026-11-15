import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { OrderCta, PageBanner, Process, Story, Values } from '@/features/home/HomeSections';

export const metadata: Metadata = { title: 'Về chúng tôi – Brew House' };

/** Route /about: câu chuyện, giá trị, quy trình. */
export default function AboutPage() {
  return (
    <>
      <Header active="/about" />
      <main>
        <PageBanner
          eyebrow="Về Brew House"
          title="Một quầy cà phê nhỏ, làm thật kỹ từng ly"
          intro="Chúng tôi tin một ly cà phê ngon bắt đầu từ hạt tốt, cách pha đúng và một chút kiên nhẫn. Phần chờ đợi, hãy để ứng dụng lo."
        />
        <Story />
        <Values />
        <Process />
        <OrderCta />
      </main>
    </>
  );
}
