/* Paper Trader service worker — scoped to /market-scanner/paper/, separate from the scanner.
   Navigations & build.json are network-first (never serve a stale run); static assets cache-first. */
const CACHE = 'paper-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL).catch(()=>{}))); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.pathname.endsWith('build.json')) { e.respondWith(fetch(e.request).catch(()=>new Response('{}',{headers:{'Content-Type':'application/json'}}))); return; }
  if (e.request.mode === 'navigate' || url.pathname.endsWith('/paper/') || url.pathname.endsWith('/index.html')) {
    e.respondWith(fetch(e.request).then(r => { const cp=r.clone(); caches.open(CACHE).then(c=>c.put('./index.html',cp)); return r; }).catch(()=>caches.match('./index.html'))); return;
  }
  e.respondWith(caches.match(e.request).then(c => c || fetch(e.request)));
});
