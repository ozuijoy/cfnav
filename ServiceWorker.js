const CACHE_NAME = 'nav-cache-v2'; // 升級快取版本號以觸發更新
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css',
  'https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js'
];

// 安裝時快取核心靜態資源
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(URLS_TO_CACHE))
  );
});

// 啟用時清理舊版本快取
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 攔截請求：真正的 Stale-While-Revalidate 策略
self.addEventListener('fetch', event => {
  // 對 API 請求不走 SW 快取，讓前端自行控制 localStorage 快取
  if (event.request.url.includes('/api/')) {
    return;
  }
  
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(cachedResponse => {
        // 發起網路請求去獲取最新資源
        const fetchPromise = fetch(event.request).then(networkResponse => {
          // 將最新的回應複製並更新到快取中，為下次訪問做準備
          if (networkResponse.ok) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // 斷網情況下的錯誤處理
        });

        // 核心：如果有快取，立即返回快取（秒開）；否則等待網路請求返回
        return cachedResponse || fetchPromise;
      });
    })
  );
});
