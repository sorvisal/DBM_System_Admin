"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Share, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const SESSION_KEY = "dbm_pwa_prompt_shown";
const DISMISS_KEY = "dbm_pwa_install_dismissed";

const promptAlreadyHandledThisVisit = (): boolean => {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
};

const markPromptHandled = (): void => {
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    /* ignore */
  }
};

function getDismissedTimestamp(): number | null {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return null;
    const ts = Number(raw);
    return Number.isFinite(ts) ? ts : null;
  } catch {
    return null;
  }
}

type PromptState =
  | "idle" // no prompt captured yet
  | "auto" // auto prompt() pending / offered
  | "manual" // show install bottom-sheet with Install button
  | "ios" // show iOS Add to Home Screen guide
  | "hidden"; // installed, dismissed, or unsupported

/**
 * PWA install manager for the DBM Retailer customer order portal.
 *
 * Flow (per browser):
 * - Capture `beforeinstallprompt` and store the deferred event.
 * - After the page has fully loaded, automatically call the native
 *   `deferredPrompt.prompt()` — but only ONCE per visit/session
 *   (tracked via sessionStorage) and only when the site is installable.
 * - If the native prompt cannot be auto-shown (refused, desktop, unsupported),
 *   fall back to a mobile bottom-sheet with an "Install" button that calls the
 *   official `prompt()` API when the user taps it.
 * - iOS has no `beforeinstallprompt`; show the "Tap Share → Add to Home
 *   Screen" guide instead.
 * - Never prompt already-installed (standalone) users.
 * - Clear the stored event after Install/Dismiss to avoid an infinite loop.
 */
export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [dismissedAt, setDismissedAt] = useState<number | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [canInstall, setCanInstall] = useState(false); // desktop Chrome/Edge can prompt() too
  const [state, setState] = useState<PromptState>("idle");

  // Detect environment once.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;

    setIsIos(ios);
    setInstalled(standalone);
    setDismissedAt(getDismissedTimestamp());

    if (standalone) {
      setState("hidden");
      return;
    }

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;
      setDeferredPrompt(event);
      setInstalled(false);
      setCanInstall(true);

      if (ios) {
        // iOS never fires beforeinstallprompt, but guard anyway.
        setState("ios");
        return;
      }

      // Auto-offer the native prompt once per visit, only after the page is loaded.
      if (!promptAlreadyHandledThisVisit()) {
        setState("auto");
      } else {
        // Already handled this session — no auto prompt, but still show a
        // manual install affordance in case the user dismissed earlier.
        setState("manual");
      }
    };

    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
      setState("hidden");
      markPromptHandled();
      try {
        localStorage.removeItem(DISMISS_KEY);
      } catch {
        /* ignore */
      }
    };

    const onFired = () => {
      // User has answered (install or dismiss) — clear stored event so we
      // never prompt again in a loop.
      markPromptHandled();
      setDeferredPrompt(null);
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        if (window.matchMedia("(display-mode: standalone)").matches) {
          setInstalled(true);
          setState("hidden");
        }
      }
    };

    // Skip the iOS path: it does not support beforeinstallprompt.
    if (!ios && "onbeforeinstallprompt" in window) {
      window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    } else {
      // iOS or a browser with no native install support.
      setState("ios");
    }

    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("appinstalled", onFired);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("appinstalled", onFired);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // Trigger the native install prompt automatically once per visit while the
  // page is visible and fully loaded.
  useEffect(() => {
    if (state !== "auto" || !deferredPrompt || installed) return;
    if (promptAlreadyHandledThisVisit()) return;

    const iv = window.setInterval(() => {
      if (document.visibilityState === "visible" && document.readyState === "complete") {
        window.clearInterval(iv);
        void promptNative();
      }
    }, 600);

    return () => window.clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, installed, deferredPrompt]);

  const promptNative = useCallback(async () => {
    const pending = deferredPrompt;
    if (!pending) {
      markPromptHandled();
      setState("manual");
      return;
    }
    try {
      markPromptHandled();
      await pending.prompt();
      const choice = await pending.userChoice;
      if (choice.outcome === "accepted") {
        setInstalled(true);
        setState("hidden");
      } else {
        // Dismissed — hide the auto prompt, keep a manual option available.
        setState("manual");
      }
    } catch {
      // The browser refused to show the prompt (e.g. not installable).
      markPromptHandled();
      setState("manual");
    } finally {
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  const handleInstall = useCallback(async () => {
    // Manual "Install" tap: use the official prompt() API.
    await promptNative();
  }, [promptNative]);

  const dismiss = useCallback(() => {
    const ts = Date.now();
    setDismissedAt(ts);
    setState("hidden");
    markPromptHandled();
    setDeferredPrompt(null);
    try {
      localStorage.setItem(DISMISS_KEY, String(ts));
    } catch {
      /* ignore */
    }
  }, []);

  const shouldShow = useMemo(() => {
    if (installed) return false;
    if (state === "hidden") return false;
    if (state === "idle") return false;
    if (dismissedAt) {
      const seventyTwoHours = 72 * 60 * 60 * 1000;
      if (Date.now() - dismissedAt < seventyTwoHours) return false;
    }
    return true;
  }, [installed, state, dismissedAt]);

  if (!shouldShow) return null;

  // iOS (and browsers with no native install support): "Add to Home Screen".
  if (state === "ios" || isIos) {
    return (
      <InstallSheet
        title="Install DBM Retailer"
        subtitle="Install the app for faster ordering and easier access."
        onClose={dismiss}
      >
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-[#eaf3ff] text-[#0d63ff]">
            <Share size={20} />
          </div>
          <div>
            <p className="pr-6 text-sm font-extrabold text-[#17304f]">
              Install DBM Retailer
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[#4c6480]">
              To install, tap{" "}
              <span className="font-bold">Share</span> →{" "}
              <span className="font-bold">Add to Home Screen</span>.
            </p>
          </div>
        </div>
      </InstallSheet>
    );
  }

  // Chrome/Edge (Android + desktop): install bottom-sheet.
  if (state === "manual" || state === "auto") {
    return (
      <InstallSheet
        title="Install DBM Retailer"
        subtitle="Install the app for faster ordering and easier access."
        onClose={dismiss}
      >
        <button
          onClick={handleInstall}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0d63ff] to-[#1a71ff] px-4 py-3 text-sm font-extrabold text-white shadow-sm"
        >
          <Download size={18} />
          Install
        </button>
        {!canInstall && (
          <p className="mt-2 text-center text-[11px] leading-relaxed text-[#71829a]">
            If the install button is unavailable, use your browser menu (⋯) →
            Install App.
          </p>
        )}
      </InstallSheet>
    );
  }

  return null;
}

/** Clean, dismissible mobile bottom-sheet used by all install states. */
function InstallSheet({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50">
      {/* touch backdrop so it feels like a sheet */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative mx-auto w-full max-w-md rounded-t-3xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(23,48,79,.18)]">
        <button
          onClick={onClose}
          aria-label="Dismiss"
          className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
        >
          <X size={14} />
        </button>
        <div className="mb-3 flex items-center gap-3 pr-8">
          <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#1a71ff] to-[#0d63ff]">
            <span className="text-[11px] font-black text-white">DBM</span>
          </div>
          <div>
            <p className="text-base font-extrabold text-[#17304f]">{title}</p>
            <p className="text-xs text-[#4c6480]">{subtitle}</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
