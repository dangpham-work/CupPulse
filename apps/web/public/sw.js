/* Service worker tối giản cho BrewLite (NFR-11, ADR-003).
 * - Lưu sẵn trang /offline và icon khi cài.
 * - Điều hướng: ưu tiên mạng, mất mạng thì hiện /offline.
 * - Tài nguyên tĩnh cùng origin (/_next/static, /images): cache-first.
 * - Không bao giờ cache API (khác origin) hay dữ liệu đơn/thanh toán. */
const CACHE = 'brewlite-v1';
const PRECACHE = ['/offline', '/icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/offline')));
    return;
  }

  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/images/') || url.pathname === '/icon.svg') {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((cache) => cache.put(request, copy));
            }
            return res;
          }),
      ),
    );
  }
});
