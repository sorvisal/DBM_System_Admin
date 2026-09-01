import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Extract the customer order token from the request Referer, if any.
 *
 * The web app manifest is served at /manifest.webmanifest. Browsers fetch it
 * while visiting the customer order page (/order/[token]), sending a Referer
 * header with the current page URL. Using it keeps `start_url` tied to the
 * exact customer order link the visitor is on (e.g. /order/ABC123) without
 * hardcoding a single token. Falls back to /order when no token is present.
 */
async function getOrderToken(): Promise<string> {
  try {
    const h = await headers();
    const referer = h.get("referer") || "";
    const m = referer.match(/\/order\/([^/?#]+)/);
    if (m && m[1]) return m[1];
  } catch {
    /* headers not available in this context */
  }
  return "";
}

const ICON_BASE = "/icons";

export async function generateStaticParams() {
  // No static params — this is a dynamic route.
  return [];
}

export default async function manifest() {
  const token = await getOrderToken();
  const startUrl = token ? `/order/${encodeURIComponent(token)}` : "/order";

  return NextResponse.json(
    {
      name: "DBM Retailer",
      short_name: "DBM",
      description:
        "DBM Retailer — browse products, build an order and track your purchases from your supplier.",
      id: "/order/",
      start_url: startUrl,
      scope: "/",
      display: "standalone",
      orientation: "portrait",
      background_color: "#edf5ff",
      theme_color: "#0d63ff",
      lang: "en",
      dir: "ltr",
      categories: ["shopping", "business"],
      icons: [
        {
          src: `${ICON_BASE}/icon-192.png`,
          sizes: "192x192",
          type: "image/png",
          purpose: "any",
        },
        {
          src: `${ICON_BASE}/icon-512.png`,
          sizes: "512x512",
          type: "image/png",
          purpose: "any",
        },
        {
          src: `${ICON_BASE}/maskable-192.png`,
          sizes: "192x192",
          type: "image/png",
          purpose: "maskable",
        },
        {
          src: `${ICON_BASE}/maskable-512.png`,
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
        {
          src: `${ICON_BASE}/app-icon.svg`,
          sizes: "any",
          type: "image/svg+xml",
          purpose: "any",
        },
      ],
    },
    {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Surrogate-Control": "no-store",
        "Expires": "0",
      },
    },
  );
}
