'use client';

import { useEffect } from 'react';

/** Đăng ký service worker (PWA, NFR-11) chỉ ở production để không cản trở dev/hot reload. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* không hỗ trợ hoặc bị chặn: app vẫn chạy bình thường */
    });
  }, []);
  return null;
}
