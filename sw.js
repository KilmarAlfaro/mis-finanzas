/* Service Worker de Mis Finanzas (ChanchitoSV)
   - Guarda en caché los archivos propios de la app para que abra rápido y también sin conexión.
   - Estrategia "red primero": siempre intenta traer la versión más nueva (así las actualizaciones que subas a GitHub
     se ven enseguida) y solo si no hay internet usa la copia guardada.
   - NO toca nada de otros dominios (Firebase, Firestore, Google, etc.): esas peticiones pasan directo a la red.
   - Solo guarda también librerías estáticas de cdnjs y las fuentes de Google, para que la app no se vea rota sin internet.
   Al publicar cambios importantes puedes subir el número de CACHE para limpiar copias viejas. */
const CACHE = 'mis-finanzas-v1';
const CORE = ['./', 'index.html', 'styles.css', 'app.js', 'icons.js', 'store.js', 'config.js', 'manifest.json',
  'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'];
const STATIC_HOSTS = ['cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    // uno por uno: si algún archivo no existe (p. ej. config.js) no se cae toda la instalación
    await Promise.allSettled(CORE.map(u => c.add(new Request(u, { cache: 'reload' }))));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('mis-finanzas-') && k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

const withTimeout = (p, ms) => new Promise((ok, no) => { const t = setTimeout(() => no(new Error('timeout')), ms); p.then(v => { clearTimeout(t); ok(v); }, e => { clearTimeout(t); no(e); }); });

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                               // guardados, logins, etc.: siempre a la red
  const url = new URL(req.url);
  const same = url.origin === self.location.origin;
  if (!same && !STATIC_HOSTS.includes(url.hostname)) return;      // Firebase / Firestore / Google: no se interceptan
  e.respondWith(same ? networkFirst(req) : cacheFirst(req));
});

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    // si la conexión está muy lenta y ya hay copia, se usa la copia en vez de dejar la pantalla esperando
    const res = await withTimeout(fetch(req), 6000);
    if (res && res.ok && res.type === 'basic') cache.put(req, res.clone());
    return res;
  } catch {
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    if (req.mode === 'navigate') { const home = await cache.match('index.html'); if (home) return home; }
    return fetch(req);                                            // sin copia: que falle como siempre
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
  return res;
}
