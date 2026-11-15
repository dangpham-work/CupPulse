import type { Metadata, Viewport } from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
import type { ReactNode } from 'react';
import { Footer } from '@/components/Footer';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';
import { Providers } from './providers';
import './globals.css';

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-be-vietnam-pro',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Brew House – Đặt cà phê',
  description: 'Xem menu, đặt món và thanh toán nhanh tại Brew House.',
  applicationName: 'Brew House',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#6f3b1f',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" className={beVietnamPro.variable}>
      <body className="flex min-h-dvh flex-col bg-cream font-sans text-ink antialiased">
        <div className="flex-1">
          <Providers>{children}</Providers>
        </div>
        <Footer />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
