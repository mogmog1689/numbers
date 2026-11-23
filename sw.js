const CACHE = 'kazu-v10';
const FILES = ['./', 'index.html', 'style.css?v=10', 'app.js?v=10', 'notes.js?v=10', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/kanji-jo.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// ネットワーク優先（常に最新を取得）、失敗時のみキャッシュ（オフライン対応）
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' }).then(res => {
      if (res.ok && res.url.startsWith(self.location.origin)) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match(e.request).then(h => h || caches.match('index.html')))
  );
});
