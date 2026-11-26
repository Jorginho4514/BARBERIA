// Barbería Jorge Sánchez · Service Worker (Network-First)
// Siempre intenta descargar de internet; la caché solo se usa si no hay conexión.
const CACHE = 'barberia-v3';
const ASSETS = ['./', 'index.html', 'manifest.json', 'icon-192.png'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c =>
      Promise.all(
        ASSETS.map(a => c.add(new Request(a, { cache: 'reload' })).catch(() => {}))
      )
    )
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// El index.html puede pedir activar de inmediato una versión nueva
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Supabase, ntfy, fuentes y CDNs externos: siempre directo a la red
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    // Red primero, ignorando la caché HTTP del navegador (siempre la versión más nueva)
    fetch(req, { cache: 'no-store' })
      .then(res => {
        if (res && res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(async () => {
        // Sin internet: usar lo último guardado
        const hit = await caches.match(req, { ignoreSearch: true });
        if (hit) return hit;
        if (req.mode === 'navigate') {
          const page = (await caches.match('index.html')) || (await caches.match('./'));
          if (page) return page;
        }
        return new Response('', { status: 504, statusText: 'Sin conexión' });
      })
  );
});
