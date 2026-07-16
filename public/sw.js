const VERSAO = "v1";
const CACHE_ESTATICO = `estatico-${VERSAO}`;
const CACHE_PAGINAS = `paginas-${VERSAO}`;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((chaves) =>
        Promise.all(
          chaves
            .filter((c) => c !== CACHE_ESTATICO && c !== CACHE_PAGINAS)
            .map((c) => caches.delete(c))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (evento) => {
  const req = evento.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // Assets estáticos com hash: cache primeiro
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    evento.respondWith(
      caches.open(CACHE_ESTATICO).then(async (cache) => {
        const emCache = await cache.match(req);
        if (emCache) return emCache;
        const resposta = await fetch(req);
        if (resposta.ok) cache.put(req, resposta.clone());
        return resposta;
      })
    );
    return;
  }

  // Navegação: rede primeiro, cache como fallback offline
  if (req.mode === "navigate") {
    evento.respondWith(
      fetch(req)
        .then((resposta) => {
          if (resposta.ok) {
            const copia = resposta.clone();
            caches.open(CACHE_PAGINAS).then((cache) => cache.put(req, copia));
          }
          return resposta;
        })
        .catch(async () => {
          const emCache = await caches.match(req);
          if (emCache) return emCache;
          const inicio = await caches.match("/");
          if (inicio) return inicio;
          return Response.error();
        })
    );
  }
});
