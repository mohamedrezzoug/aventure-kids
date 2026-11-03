// عالم المغامرات – اللعب بلا أنترنيت (cache)
const V = 'ak-v7';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'css/style.css?v=7', 'js/main.js?v=7', 'js/three.module.js', 'js/i18n.js?v=7', 'js/audio.js?v=7', 'js/state.js?v=7', 'js/characters.js?v=7', 'js/world.js?v=7', 'js/worlds.js?v=7',
  'fonts/Tajawal-Medium.ttf', 'fonts/Tajawal-Bold.ttf', 'fonts/Tajawal-ExtraBold.ttf', 'icons/icon-192.png', 'icons/icon-512.png', 'audio/manifest.json'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
// الشبكة أولا (باش التحديثات توصل)، و إلا ما كايناش نخدمو من الكاش
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request, { cache: 'no-cache' }).then(r => { const cp = r.clone(); caches.open(V).then(c => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request)));
});
