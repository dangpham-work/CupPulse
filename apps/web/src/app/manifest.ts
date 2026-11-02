import type { MetadataRoute } from 'next';

/** Web App Manifest để cài BrewLite như ứng dụng (NFR-11, ADR-003). Service worker bổ sung ở Sprint 2. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BrewLite – Đặt cà phê',
    short_name: 'BrewLite',
    description: 'Xem menu, đặt món và thanh toán nhanh tại BrewLite.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fafaf9',
    theme_color: '#7a4a1e',
    lang: 'vi',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  };
}
