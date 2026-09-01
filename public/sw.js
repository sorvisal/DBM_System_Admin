/* DBM Retailer — customer order PWA service worker (v3).
 *
 * Changes from v2:
 *   - Bumped cache version to v3 to invalidate stale caches after the
 *     token-validation fix (portal-context no longer conflates network
 *     errors with invalid tokens).
 *
 * CACHE STRATEGY
 * --------------
 *   /_next/static/*     → Cache-first  (content-hashed, immutable)
 *   /api/*              → Pass-through (never cached — no user data)
 *   /order/[token]/*    → Network-first, no-store  (dynamic, user-specific)
 *   /                   → Network-first, no-store  (dynamic, auth-gated)
 *   Images / fonts etc. → Network-first, cache-on-miss
 *
 * OFFLINE BEHAVIOUR
 * -----------------
 * When offline, navigation requests fall back to / (the app shell).  The SPA
 * boots from the cached shell and shows the offline state.  Static assets
 * already cached are served from cache.  API calls fail as expected (the app
 * shows an error message).
 */

// ── Cache version ────────────────────────────────────────────────────────────
// Bump this string whenever you change the caching strategy.  The old cache
// name becomes stale and is automatically deleted on the next activate event.
const CACHE_VERSION = "dbm-cache-v3";

const VERSIONED = {
  shell: `${CACHE_VERSION}-shell`,   // icons, manifest, fonts, app shell (/)
  static: `${CACHE_VERSION}-static`, // /_next/static/* hashed assets
};

// Safe assets to precache for offline boot.  These never change and are
// referenced by filename-hash, so they are safe to cache permanently.
const SHELL_ASSETS = [
  "/",
  "/manifest.webmanifest",
  "/icons/app-icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-192.png",
  "/icons/maskable-512.png",
  "/icons/apple-touch-icon.png",
];

// ── URL helpers ─────────────────────────────────────────────────────────────
const origin = self.location.origin;

const isSameOrigin = (url) => url.origin === origin;

const isNextStatic = (url) =>
  isSameOrigin(url) && url.pathname.startsWith("/_next/static/");

const isApiRequest = (url) =>
  isSameOrigin(url) && url.pathname.startsWith("/api/");

const isNavigation = (request) => request.mode === "navigate";

const isCustomerOrderRoute = (url) =>
  isSameOrigin(url) && url.pathname.startsWith("/order/");

// ── Install ──────────────────────────────────────────────────────────────────
// Precache the app shell and immediately skip waiting so the new SW can
// activate without requiring all tabs to close first.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSIONED.shell)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

// ── Activate ─────────────────────────────────────────────────────────────────
// Delete every cache whose name does not start with the current version prefix.
// This removes old HTML, stale JS bundles, and any previous version's assets.
// Then claim all open clients so they use the new worker immediately.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !key.startsWith(CACHE_VERSION))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// ── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin requests entirely.
  if (request.method !== "GET" || !isSameOrigin(url)) return;

  // API requests: pass through untouched.  Never cache auth tokens,
  // passwords, checkout, orders, cart, or any private customer data.
  if (isApiRequest(url)) return;

  // ── Static hashed assets ─────────────────────────────────────────────
  // /_next/static/* files are content-hashed by Next.js — the filename
  // changes when the file content changes.  Cache-first is safe and optimal.
  if (isNextStatic(url)) {
    event.respondWith(
      caches.open(VERSIONED.static).then((cache) =>
        cache.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request).then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          });
        }),
      ),
    );
    return;
  }

  // ── Navigation requests (HTML pages) ──────────────────────────────────
  // /order/[token] and other dynamic pages: always hit the network with
  // cache: "no-store" so the server returns the latest HTML on every visit.
  // Order routes are dynamic and user-specific — never serve stale cached HTML.
  if (isNavigation(request)) {
    const fetchPromise = fetch(request, { cache: "no-store" });
    event.respondWith(
      fetchPromise.catch(() => {
        // Offline fallback: serve the precached app shell (/) so the SPA
        // can still boot and show the offline state instead of a browser
        // error page.
        return caches.match("/").then((shell) => shell || Response.error());
      }),
    );
    return;
  }

  // ── Other same-origin GETs (images, fonts, etc.) ──────────────────────
  // Network-first; cache the response on miss so repeat visits are fast.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          caches.open(VERSIONED.shell).then((cache) => cache.put(request, response.clone()));
        }
        return response;
      })
      .catch(() => caches.match(request)),
  );
});
