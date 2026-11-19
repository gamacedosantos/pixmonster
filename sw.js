// Service worker do PixMonster: guarda o que o jogo já carregou para abrir sem internet.
// Rede primeiro: com internet o jogo sempre pega a versão nova (JS em cache misturado já travou o jogo); o cache só entra se a rede falhar.
// shortcut: não pré-carrega nada, então a 1ª abertura offline só funciona depois de uma visita online completa; para pré-carregar, listar os arquivos em ARQUIVOS.
const CACHE = 'pixmonster-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const q = e.request;
  if (q.method !== 'GET' || new URL(q.url).origin !== location.origin || q.headers.has('range')) return; // áudio em pedaços (206) não cabe no cache
  e.respondWith(fetch(q).then((r) => {
    if (r.status === 200) { const c = r.clone(); caches.open(CACHE).then((ch) => ch.put(q, c)); }
    return r;
  }).catch(() => caches.match(q, { ignoreSearch: true })));
});
