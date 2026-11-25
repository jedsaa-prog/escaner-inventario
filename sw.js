// Escáner de inventario y "Ubica tu libro" · CRAI UAO
// Permite abrir las páginas sin conexión después de haberlas usado una vez con internet.
// Páginas y datos: primero la red (para tener siempre la última versión); si no hay red, la copia guardada.
// Librerías externas (lector de texto y de códigos): primero la copia guardada.
const CACHE = 'crai-v1';
const PRECARGA = ['./', './index.html', './consulta/', './consulta/index.html', './icono-192.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECARGA).catch(() => {})).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

const externo = url => /(^|\.)(jsdelivr\.net|unpkg\.com|tessdata\.projectnaptha\.com)$/.test(url.hostname);

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(req).then(r => {
        if (r.ok) { const copia = r.clone(); caches.open(CACHE).then(c => c.put(req, copia)); }
        return r;
      }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('./index.html')))
    );
  } else if (externo(url)) {
    e.respondWith(
      caches.match(req).then(r => r || fetch(req).then(res => {
        if (res.ok || res.type === 'opaque') { const copia = res.clone(); caches.open(CACHE).then(c => c.put(req, copia)); }
        return res;
      }))
    );
  }
});
