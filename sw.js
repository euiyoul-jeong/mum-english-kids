// 앱 셸 캐시 — 파일을 바꾸면 VERSION과 index.html의 ?v= 값을 함께 올릴 것
const VERSION = 'v2';
const CACHE = `mumkids-${VERSION}`;
const SHELL = [
  './',
  './index.html',
  `./css/app.css?${VERSION}`,
  `./js/data.js?${VERSION}`,
  `./js/app.js?${VERSION}`,
  './manifest.webmanifest',
  './favicon.ico',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('mumkids-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  // 외부 도메인(콘텐츠 사이트, 폰트)은 관여하지 않음
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  // 페이지 이동: 네트워크 우선, 실패 시 캐시된 셸
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // 정적 파일: 네트워크 우선(HTML과 버전이 어긋나지 않게), 오프라인이면 캐시
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req))
  );
});
