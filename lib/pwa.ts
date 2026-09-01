/**
 * PWA helpers for the DBM Retailer customer order system.
 *
 * Service-worker architecture (v3):
 *   - sw.js caches assets in versioned caches keyed by CACHE_VERSION.
 *   - On install the SW precaches the app shell (icons, manifest, fonts).
 *   - On activate ALL stale caches (any cache not matching CACHE_VERSION)
 *     are deleted, then all open clients are claimed.
 *   - Navigation HTML (/order/[token], /login, etc.) is ALWAYS fetched from
 *     the network (cache: "no-store") — never served from cache.  This
 *     ensures deployed component changes appear immediately.
 *   - Token validation is done server-side on each page load; the client
 *     never caches or reuses a previous token's validation result.
 *
 * Client-side update detection:
 *   - On every page load the client calls /api/sw-version to check if a new
 *     deployment is available (the endpoint returns a version derived from
 *     the build manifest content hash).
 *   - If the version differs from the last-known value, registration.update()
 *     is called so the new service worker installs and activates.
 *   - When a new SW finishes installing (updatefound event), the user is
 *     prompted to reload after a short delay — no manual cache clear needed.
 */

/**
 * The cache version string MUST match CACHE_VERSION in public/sw.js.
 * Bump this whenever you change the service-worker caching logic.
 */
const CACHE_VERSION = "dbm-cache-v3";
const VERSION_STORAGE_KEY = "dbm_sw_version";

/**
 * Inline script emitted into the page <body>.  Kept as a string so it can be
 * rendered from the root layout without a client component.
 */
export const registerPwaServiceWorker = `(function(){try{
  if(!("serviceWorker" in navigator)) return;

  var CACHE_VERSION = "${CACHE_VERSION}";
  var VERSION_KEY   = "${VERSION_STORAGE_KEY}";

  /* ── Helpers ─────────────────────────────────────────────────────────── */
  function getStoredVersion() {
    try { return localStorage.getItem(VERSION_KEY); } catch(e) { return null; }
  }
  function setStoredVersion(v) {
    try { localStorage.setItem(VERSION_KEY, v); } catch(e) {}
  }

  /* ── Register the service worker ─────────────────────────────────────── */
  function register() {
    return navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then(function(reg) {

        /* ── Detect new deployments by polling the version endpoint ────── */
        function checkForUpdate() {
          fetch("/api/sw-version", { cache: "no-store" })
            .then(function(r) { return r.json(); })
            .then(function(data) {
              var newVersion = data.version;
              var oldVersion = getStoredVersion();
              if (oldVersion !== newVersion) {
                // Version changed — a new deployment is available.
                // Trigger the service worker to install itself.
                reg.update();
              }
              setStoredVersion(newVersion);
            })
            .catch(function() {
              /* /api/sw-version unavailable (e.g. dev environment) —
                 still try to update the SW so it picks up any script change. */
              reg.update();
            });
        }

        // Check immediately on load, then every 30 seconds.
        checkForUpdate();
        setInterval(checkForUpdate, 30000);

        /* ── React to new SW installation ──────────────────────────────── */
        reg.addEventListener("updatefound", function() {
          var newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", function() {
            // SW installed and waiting for pages to close.
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // Prompt the user to reload after a short delay.
              setTimeout(function() {
                if (confirm(
                  "A new version of DBM Retailer is available. " +
                  "Reload to see the latest changes?"
                )) {
                  window.location.reload();
                }
              }, 2000);
            }
          });
        });

        /* ── React to SW becoming active ───────────────────────────────── */
        navigator.serviceWorker.addEventListener("controllerchange", function() {
          // A new SW has taken control — sync the stored version.
          fetch("/api/sw-version", { cache: "no-store" })
            .then(function(r) { return r.json(); })
            .then(function(data) { setStoredVersion(data.version); })
            .catch(function() {});
        });

        return reg;
      })
      .catch(function() {
        /* Service worker registration failed — the app still works without it. */
      });
  }

  /* ── Bootstrap ───────────────────────────────────────────────────────── */
  if (document.readyState === "complete") {
    register();
  } else {
    window.addEventListener("load", register);
  }

} catch(e) {}})();`;
