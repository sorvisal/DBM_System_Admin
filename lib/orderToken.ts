/**
 * Token persistence helpers for the DBM Retailer customer order PWA.
 *
 * When a valid order token is opened (from the URL or from a PWA launch),
 * it is saved to localStorage so that subsequent PWA opens without an
 * explicit token in the URL can resume the last session.
 *
 * Priority: URL token > saved token > nothing.
 */

const TOKEN_KEY = "dbm_current_order_token";

export function getCurrentOrderToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    return raw?.trim() || null;
  } catch {
    return null;
  }
}

export function setCurrentOrderToken(token: string): void {
  if (typeof window === "undefined") return;
  const normalized = token.trim();
  if (!normalized) return;
  try {
    localStorage.setItem(TOKEN_KEY, normalized);
  } catch { /* storage full or unavailable — safe to ignore */ }
}

export function clearCurrentOrderToken(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch { /* ignore */ }
}
