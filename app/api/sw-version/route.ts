/**
 * GET /api/sw-version
 *
 * Returns the current deployment version as JSON: { "version": "…" }.
 *
 * The version is derived from the build manifest file.  When a new deployment
 * changes the build output, the manifest content changes and this endpoint
 * returns a different version string.  The service worker and the client both
 * call this endpoint to detect when a new deployment is available.
 *
 * Cache-Control headers ensure browsers and CDNs never serve a stale version
 * of this response — the version must always reflect the currently running build.
 */
import { NextResponse } from "next/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function getBuildVersion(): string {
  // The build manifest lives at build/static/<hash>/_buildManifest.js.
  // We scan the static directory for any _buildManifest.js and hash its content.
  try {
    const staticDir = join(process.cwd(), "build", "static");
    const entries = require("node:fs").readdirSync(staticDir);
    for (const entry of entries) {
      if (entry === "chunks" || entry === "media") continue;
      const manifestPath = join(staticDir, entry, "_buildManifest.js");
      if (require("node:fs").existsSync(manifestPath)) {
        const content = readFileSync(manifestPath, "utf8");
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
          hash = ((hash << 5) - hash + content.charCodeAt(i)) | 0;
        }
        return `v${Math.abs(hash).toString(16)}`;
      }
    }
  } catch {
    /* fall through */
  }

  // Ultimate fallback: use the mtime of the build directory
  try {
    const buildDir = join(process.cwd(), "build");
    const mtime = require("node:fs").statSync(buildDir).mtimeMs;
    return `v${Math.floor(mtime / 1000)}`;
  } catch {
    return `v${Math.floor(Date.now() / 1000)}`;
  }
}

export async function GET() {
  const version = getBuildVersion();
  return NextResponse.json({ version, ts: Date.now() }, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Surrogate-Control": "no-store",
      "Expires": "0",
    },
  });
}
