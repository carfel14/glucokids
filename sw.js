/* =========================================================
   GlucoKids · Service worker
   Guarda la estructura y los recursos locales para abrir la app sin conexión
   después de una primera carga correcta (desde localhost o HTTPS).
   No sincroniza datos: los datos de la demo viven en localStorage.
   ========================================================= */
const CACHE_PREFIX = 'glucokids-static-';
const CACHE = `${CACHE_PREFIX}v1`;

const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/tokens.css',
  './css/layout.css',
  './css/components.css',
  './css/pages.css',
  './js/app.js',
  './js/router.js',
  './js/store.js',
  './js/seed.js',
  './js/data.js',
  './js/actions.js',
  './js/utils.js',
  './js/icons.js',
  './js/illustrations.js',
  './js/content/topics.js',
  './js/content/story.js',
  './js/content/achievements.js',
  './js/content/resources.js',
  './js/components/modal.js',
  './js/components/toast.js',
  './js/components/chart.js',
  './js/components/forms.js',
  './js/components/ui.js',
  './js/components/glucoseForm.js',
  './js/components/reminders.js',
  './js/components/install.js',
  './js/components/shell.js',
  './js/pages/public.js',
  './js/pages/auth.js',
  './js/pages/dashboard.js',
  './js/pages/familia.js',
  './js/pages/glucosa.js',
  './js/pages/plan.js',
  './js/pages/escuela.js',
  './js/pages/incidentes.js',
  './js/pages/mensajes.js',
  './js/pages/aprende.js',
  './js/pages/calendario.js',
  './js/pages/recursos.js',
  './js/pages/reportes.js',
  './js/pages/configuracion.js',
  './js/pages/suscripcion.js',
  './assets/img/glucokids-logo.png',
  './assets/img/glucokids-ilustracion.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-maskable-512.png',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/favicon-48.png',
  './assets/fonts/nunito-latin.woff2',
  './assets/fonts/nunito-latin-ext.woff2',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

// Elimina solo versiones antiguas de la caché de GlucoKids
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith(CACHE_PREFIX) && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // la demo no depende de servicios externos

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put('./index.html', copy));
        return res;
      }).catch(() => caches.match('./index.html')),
    );
    return;
  }

  // Red primero para mantener la demo actualizada; caché como respaldo sin conexión
  event.respondWith(
    fetch(req.url, { cache: 'no-cache' }).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true })),
  );
});
