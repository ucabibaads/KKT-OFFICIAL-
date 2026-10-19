// Service worker Keuangan KKT.
// PENTING: naikkan angka VERSI (kkt-v2, kkt-v3, ...) setiap kali mengunggah versi baru ke Netlify.
const VERSI = 'kkt-v1';
const SHELL = ['./', 'index.html', 'manifest.json', 'icon.svg', 'icon-180.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];
const LUAR = ['www.gstatic.com', 'fonts.googleapis.com', 'fonts.gstatic.com']; // pustaka Firebase dan font

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSI).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== VERSI).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === self.location.origin) {
    // Halaman: jaringan dulu agar pembaruan langsung terlihat; cache dipakai saat offline.
    if (req.mode === 'navigate') {
      e.respondWith(
        fetch(req)
          .then(r => {
            if (r.ok && !r.redirected) { const c = r.clone(); caches.open(VERSI).then(ch => ch.put('index.html', c)); }
            return r;
          })
          .catch(() => caches.match('index.html'))
      );
      return;
    }
    // Berkas lain di situs ini: tampil dari cache, diperbarui di latar belakang.
    e.respondWith(
      caches.match(req).then(hit => {
        const net = fetch(req)
          .then(r => { if (r.ok) { const c = r.clone(); caches.open(VERSI).then(ch => ch.put(req, c)); } return r; })
          .catch(() => hit);
        return hit || net;
      })
    );
    return;
  }

  // Pustaka Firebase (berversi) dan font: cache dulu. Permintaan data Firestore/Auth tidak disentuh.
  if (LUAR.includes(url.hostname)) {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(r => {
        if (r.ok || r.type === 'opaque') { const c = r.clone(); caches.open(VERSI).then(ch => ch.put(req, c)); }
        return r;
      }))
    );
  }
});
