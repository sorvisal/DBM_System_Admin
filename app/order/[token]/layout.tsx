"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
  History, Home, LayoutGrid, LogOut, ShoppingCart, User, Menu, X,
} from "lucide-react";
import { PortalProvider, usePortal } from "./portal-context";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import { getCurrentOrderToken } from "@/lib/orderToken";

export default function OrderLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const router = useRouter();
  const redirectRef = useRef(false);
  const [token, setToken] = useState<string>("");

  // Derive the token to use:
  // 1. URL parameter wins if present.
  // 2. Otherwise read the saved token from localStorage.
  // 3. If a saved token exists but the URL has none, redirect so the app
  //    always runs with an explicit token in the URL (prevents cross-token
  //    state leaks and keeps the browser history clean).
  useEffect(() => {
    const urlToken = String(params.token ?? "");
    if (urlToken) {
      setToken(urlToken);
      return;
    }
    const saved = getCurrentOrderToken();
    if (saved && !redirectRef.current) {
      redirectRef.current = true;
      router.replace(`/order/${saved}`);
    } else {
      setToken(saved || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  return (
    <PortalProvider token={token}>
      <Shell>{children}</Shell>
    </PortalProvider>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const { token, status, session, totalQty, signOut, error, retryValidation } = usePortal();
  const pathname = usePathname();
  const router = useRouter();
  const base = `/order/${token}`;
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const isRoot = pathname === base;

  useEffect(() => {
    if (status !== "ready") return;
    if (!session && !isRoot) router.replace(base);
    if (session && isRoot) router.replace(`${base}/home`);
  }, [status, session, isRoot, pathname, base, router]);

  if (status === "loading" || status === "invalid" || status === "error") return <BootScreen invalid={status === "invalid"} error={status === "error" ? error : null} onRetry={status === "error" ? retryValidation : undefined} />;

  const hideChrome = isRoot;
  const isActive = (href: string) =>
    href.endsWith("/home")
      ? pathname === `${base}/home`
      : pathname?.startsWith(href);

  const navItems = [
    { href: `${base}/home`,    label: "Home",      icon: Home },
    { href: `${base}/products`, label: "Products", icon: LayoutGrid },
    { href: `${base}/cart`,     label: "Cart",     icon: ShoppingCart },
    { href: `${base}/orders`,   label: "Order History", icon: History },
    { href: `${base}/account`,  label: "Account",  icon: User },
  ];

  function renderNavItem({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) {
    const active = isActive(href);
    return (
      <Link key={href} href={href}
        className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors ${
          active ? "bg-white/20 font-semibold text-white" : "text-white/80 hover:bg-white/10 hover:text-white"
        }`}>
        <Icon size={19} className="text-white" />
        <span className="flex-1 text-white">{label}</span>
        {href.endsWith("/cart") && totalQty > 0 && (
          <span data-testid="cart-count"
            className="min-w-6 rounded-full bg-white px-1.5 text-center text-[11px] font-bold text-[#0d63ff]">
            {totalQty}
          </span>
        )}
      </Link>
    );
  }

  /* -------- Mobile bottom nav -------- */
  function MobileNavBar() {
    return (
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-gray-100 shadow-[0_-6px_20px_rgba(23,48,79,.10)] md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="mx-auto grid max-w-md grid-cols-5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = href.endsWith("/cart")
              ? pathname?.startsWith(`${base}/cart`) || pathname?.startsWith(`${base}/checkout`)
              : isActive(href);
            return (
              <Link key={href} href={href}
                className={`relative flex flex-col items-center gap-0.5 py-2 transition-colors ${active ? "text-[#0d63ff]" : "text-slate-500"} active:bg-slate-200/70`}>
                <span className="relative">
                  <span className={`grid h-8 w-12 place-items-center rounded-lg ${active ? "bg-white font-bold shadow-sm" : ""}`}>
                    <Icon size={19} />
                  </span>
                  {href.endsWith("/cart") && totalQty > 0 && (
                    <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-[#ef5b62] px-1 text-[9px] font-black text-white">
                      {totalQty}
                    </span>
                  )}
                </span>
                <span className={`text-[10px] ${active ? "font-extrabold" : "font-semibold"}`}>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#edf5ff] via-[#f7faff] to-[#f4f7fb] text-[#17304f]">
      {hideChrome
        ? children
        : <>
            <MobileNavBar />

            {/* Desktop sidebar — slides in/out with CSS transition */}
            <aside className={`fixed inset-y-0 left-0 z-40 hidden w-60 bg-gradient-to-b from-[#0d63ff] via-[#0e5ae7] to-[#1655c8] py-5 transition-all duration-200 md:flex md:flex-col ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
              <div className="flex h-full flex-col">
                <div className="flex items-center gap-3 px-4 pb-5 pt-1">
                  <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-white shadow-md">
                    <span className="text-sm font-black text-[#0d63ff]">DBM</span>
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-base font-bold leading-tight text-white">DBM Retailer</div>
                    <div className="truncate text-[11px] leading-tight text-white/60">Customer ordering portal</div>
                  </div>
                </div>
                <nav className="flex flex-col gap-1 overflow-y-auto px-3">
                  {navItems.map(renderNavItem)}
                </nav>
                {session && (
                  <button onClick={() => { signOut(); router.replace(base); }}
                    className="mx-3 mt-2 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/20 hover:text-red-300">
                    <LogOut size={19} className="text-red-400" /> Sign Out
                  </button>
                )}
                <div className="mt-auto px-4 pb-4 pt-3 text-[11px] leading-relaxed text-white/60">
                  Browse products, build a multi-product order and track your purchases.
                </div>
              </div>
            </aside>

            {/* Desktop sidebar toggle button */}
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="fixed top-4 left-4 z-50 hidden h-9 w-9 items-center justify-center rounded-xl bg-white/90 shadow-md backdrop-blur transition-colors hover:bg-white md:flex"
              title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
            >
              {sidebarOpen ? <X size={18} className="text-[#0d63ff]" /> : <Menu size={18} className="text-[#0d63ff]" />}
            </button>

            {/* Page content */}
            <main className={`pb-20 transition-all duration-200 md:pb-6 ${sidebarOpen ? "md:pl-60" : "md:pl-0"}`}>
              <div className="mx-auto max-w-5xl px-3 pb-4 sm:px-4 md:px-6">{children}</div>
            </main>
          </>
      }

      {/* Installable PWA prompt — shown on mobile when install is available */}
      <PWAInstallPrompt />
    </div>
  );
}

function BootScreen({ invalid, error, onRetry }: { invalid: boolean; error: string | null; onRetry?: () => void }) {
  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-b from-[#edf5ff] to-[#f4f7fb] px-4 text-center">
      {invalid ? (
        <div className="max-w-sm">
          <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-full bg-red-50 text-3xl">🚫</div>
          <h1 className="text-lg font-bold text-slate-800">This ordering link is no longer available.</h1>
          <p className="mt-2 text-sm text-slate-500">
            The link may have been disabled, expired, or reached its usage limit. Please contact your supplier.
          </p>
        </div>
      ) : error ? (
        <div className="max-w-sm">
          <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-full bg-amber-50 text-3xl">⚠️</div>
          <h1 className="text-lg font-bold text-slate-800">Unable to load ordering link</h1>
          <p className="mt-2 text-sm text-slate-500">
            {error}
          </p>
          <button onClick={onRetry}
            className="mt-4 h-10 rounded-xl bg-gradient-to-r from-[#0d63ff] to-[#1a71ff] px-6 text-sm font-bold text-white hover:opacity-95">
            Try again
          </button>
        </div>
      ) : (
        <div>
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-[3px] border-slate-200 border-t-[#0d63ff]" />
          <p className="mt-4 text-sm text-slate-500">Loading ordering portal…</p>
        </div>
      )}
    </div>
  );
}
