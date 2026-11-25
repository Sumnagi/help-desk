/* sw.js - Service worker: rede primeiro, cache como reserva (funciona offline). */
const CACHE = "helpdesk-v7";
const ARQUIVOS = [
    "./",
    "index.html",
    "chamados.html",
    "style.css",
    "storage.js",
    "app.js",
    "chamados.js",
    "pwa.js",
    "manifest.json",
    "icons/icon-192.png",
    "icons/icon-512.png",
];

self.addEventListener("install", (evento) => {
    evento.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARQUIVOS)));
    self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
    evento.waitUntil(
        caches.keys().then((chaves) =>
            Promise.all(chaves.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener("fetch", (evento) => {
    const req = evento.request;
    if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;

    evento.respondWith(
        fetch(req)
            .then((resposta) => {
                const copia = resposta.clone();
                caches.open(CACHE).then((c) => c.put(req, copia));
                return resposta;
            })
            .catch(() => caches.match(req, { ignoreSearch: true }))
    );
});
