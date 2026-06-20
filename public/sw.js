const CACHE_VERSION = 'workout-planner-v0.8.2'
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`
const scopeUrl = new URL('./', self.registration.scope)
const indexUrl = new URL('./index.html', scopeUrl)

const STATIC_ASSETS = [
  new URL('./manifest.webmanifest', scopeUrl).href,
  new URL('./icons/icon-192.png', scopeUrl).href,
  new URL('./icons/icon-512.png', scopeUrl).href,
  new URL('./icons/icon-maskable-512.png', scopeUrl).href,
  new URL('./icons/apple-touch-icon.png', scopeUrl).href,
  new URL('./icons/favicon-64.png', scopeUrl).href,
]

async function precacheApplication() {
  const cache = await caches.open(CACHE_VERSION)
  const indexResponse = await fetch(indexUrl, { cache: 'reload' })
  const html = await indexResponse.clone().text()

  await cache.put(indexUrl.href, indexResponse.clone())
  await cache.put(scopeUrl.href, indexResponse.clone())

  const documentAssets = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
    .map((match) => new URL(match[1], indexUrl).href)
    .filter((url) => url.startsWith(scopeUrl.href))

  await cache.addAll([...new Set([...STATIC_ASSETS, ...documentAssets])])
}

self.addEventListener('install', (event) => {
  event.waitUntil(precacheApplication().then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const requestUrl = new URL(request.url)
  if (requestUrl.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy))
          return response
        })
        .catch(async () => {
          return (
            (await caches.match(request)) ||
            (await caches.match(scopeUrl.href)) ||
            (await caches.match(indexUrl.href))
          )
        }),
    )
    return
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const networkResponse = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone()
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy))
          }
          return response
        })
        .catch(() => cachedResponse)

      return cachedResponse || networkResponse
    }),
  )
})
