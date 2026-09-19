import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

  const isDev = process.env.NODE_ENV !== "production";
  const connectSrc = [
    "'self'",
    "https://dbmapi.sorvisal.site",
    ...(isDev ? [
      "https://dbmapi.sorvisal.site",
      "wss://dbmapi.sorvisal.site",
      "http://127.0.0.1:5180",
      "ws://dbmapi.sorvisal.site",
      "ws://127.0.0.1:5180",
      "http://127.0.0.1:3000",
      "ws://127.0.0.1:3000",
      "ws://localhost:51000",
      "ws://127.0.0.1:51000",
    ] : [
      "https://dbmapi.sorvisal.site",
      "wss://dbmapi.sorvisal.site",
      "ws://dbmapi.sorvisal.site",
      "ws://127.0.0.1:5180",
    ]),
  ].join(" ");

  const SECURITY_HEADERS: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Strict-Transport-Security": process.env.NODE_ENV === "production"
      ? "max-age=63072000; includeSubDomains; preload"
      : "max-age=0",
    "Content-Security-Policy": [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://code.googleapis.com https://static.cloudflareinsights.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https: http:",
      "font-src 'self' https://fonts.gstatic.com",
      `connect-src ${connectSrc}`,
      "frame-src https://accounts.google.com https://t.me",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  };

function generateCsrfToken(): string {
  const bytes = new Uint8Array(32);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  const { pathname } = request.nextUrl;

  // The service worker must never be cached so updates are picked up promptly.
  // The web app manifest should also always be revalidated (start_url may
  // depend on the current order token).
  if (pathname === "/sw.js") {
    response.headers.set("Content-Type", "application/javascript; charset=utf-8");
    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
    return response;
  }
  if (pathname === "/manifest.webmanifest") {
    response.headers.set("Cache-Control", "no-cache, must-revalidate");
  }

  // No-cache for HTML to prevent stale chunk references
  if (request.headers.get("accept")?.includes("text/html")) {
    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
    response.headers.set("Pragma", "no-cache");
  }

  const csrfCookie = request.cookies.get("dbm_csrf");
  if (!csrfCookie) {
    response.cookies.set("dbm_csrf", generateCsrfToken(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!build/static|build/_next|favicon.ico|api/).*)"],
};
