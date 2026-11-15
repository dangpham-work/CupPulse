import { Header } from '@/components/Header';
import { StaffBoard } from '@/features/staff/StaffBoard';

/** Route /staff (FR-12). */
export default function StaffPage() {
  return (
    <>
      <Header active="/staff" />
      <main className="mx-auto max-w-[1440px] px-4 py-8 md:px-10 md:py-12 lg:px-20">
        <StaffBoard />
      </main>
    </>
  );
}
