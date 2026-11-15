import { Header } from '@/components/Header';
import { ProductDetailView } from '@/features/product/ProductDetailView';

/** Route /products/:id (SRS mục 9). */
export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <Header active="/menu" />
      <main className="mx-auto max-w-[1440px] px-4 py-8 md:px-10 md:py-12 lg:px-20">
        <ProductDetailView id={id} />
      </main>
    </>
  );
}
