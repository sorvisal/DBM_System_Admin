import type { ApiResponse, UserDto } from "@/lib/types";

const RAW_BASE = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");

export const API_ORIGIN = RAW_BASE;
export const API_BASE = RAW_BASE + "/api/v1";
export const SWAGGER_URL = RAW_BASE;

const TOKENS_KEY = "dbm_tokens";
const USER_KEY = "dbm_user";
const CSRF_HEADER = "X-CSRF-Token";

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
}

export function getTokens(): StoredTokens | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(TOKENS_KEY);
    return raw ? (JSON.parse(raw) as StoredTokens) : null;
  } catch {
    return null;
  }
}

export function setTokens(t: StoredTokens) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKENS_KEY, JSON.stringify(t));
}

export function clearTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKENS_KEY);
}

export function getStoredUser(): UserDto | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as UserDto) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(u: UserDto | null) {
  if (typeof window === "undefined") return;
  if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
  else localStorage.removeItem(USER_KEY);
}

export function getCsrfToken(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|; )dbm_csrf=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export function uploadsUrl(path?: string | null): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("blob:")) return path;
  const origin = API_ORIGIN || (typeof window !== "undefined" ? window.location.origin : "");
  return origin + "/uploads/" + path.replace(/^\/+/, "");
}

let refreshInFlight: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const t = getTokens();
    if (!t?.refreshToken) return false;
    try {
      const res = await fetch(API_BASE + "/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Client-App": "admin-web" },
        body: JSON.stringify({ refreshToken: t.refreshToken }),
      });
      if (!res.ok) return false;
      const json = (await res.json()) as ApiResponse<{
        accessToken: string;
        refreshToken: string;
        user: UserDto;
      }>;
      if (!json?.success || !json.data?.accessToken) return false;
      setTokens({
        accessToken: json.data.accessToken,
        refreshToken: json.data.refreshToken,
      });
      if (json.data.user) setStoredUser(json.data.user);
      return true;
    } catch {
      return false;
    }
  })();
  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

export class ApiError extends Error {
  status: number;
  fieldErrors: Record<string, string>;
  kind: "network" | "unauthorized" | "business" | undefined;

  constructor(message: string, status = 0, fieldErrors: Record<string, string> = {}, kind?: "network" | "unauthorized" | "business") {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.kind = kind;
    this.name = "ApiError";
  }
}

function extractApiErrorMessage(json: unknown, status: number): string {
  if (!json || typeof json !== "object") return messageForStatus(status);
  const obj = json as Record<string, unknown>;

  // Our ApiResponse<T> format: { success, error, data }
  if (typeof obj.error === "string" && obj.error.trim()) return obj.error;
  // ASP.NET Core problem details
  if (typeof obj.title === "string" && obj.title.trim()) return obj.title;
  if (typeof obj.message === "string" && obj.message.trim()) return obj.message;
  // Top-level error array: { errors: ["msg1", "msg2"] }
  if (Array.isArray(obj.errors)) {
    const first = (obj.errors as unknown[]).find((e): e is string => typeof e === "string" && !!e.trim());
    if (first) return first;
  }
  // Field validation object: { errors: { field: ["msg"] } } — already handled by parseFieldErrors
  return messageForStatus(status);
}

function messageForStatus(status: number, fallback?: string | null): string {
  if (fallback && fallback.trim()) return fallback;
  switch (status) {
    case 400:
      return "Invalid request.";
    case 401:
      return "UNAUTHORIZED";
    case 403:
      return "You do not have permission to do that.";
    case 404:
      return "Record not found.";
    case 409:
      return "This record cannot be changed because it is referenced by other data.";
    case 422:
      return "Validation failed.";
    case 500:
      return "Something went wrong. Please try again.";
    default:
      return "HTTP " + status;
  }
}

function parseFieldErrors(json: unknown): Record<string, string> {
  if (!json || typeof json !== "object") return {};
  const obj = json as Record<string, unknown>;
  const errors = obj.errors;
  if (!errors || typeof errors !== "object") return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(errors as Record<string, unknown>)) {
    if (Array.isArray(value) && value.length > 0) out[key] = String(value[0]);
    else if (typeof value === "string") out[key] = value;
  }
  return out;
}

function redirectToLogin() {
  if (typeof window === "undefined") return;
  if (window.location.pathname === "/login") return;
  window.location.replace("/login");
}

function authHeaders(mutating: boolean, json: boolean): Record<string, string> {
  const headers: Record<string, string> = { "X-Client-App": "admin-web" };
  if (json) headers["Content-Type"] = "application/json";
  const t = getTokens();
  if (t?.accessToken) headers.Authorization = "Bearer " + t.accessToken;
  if (mutating) {
    const csrf = getCsrfToken();
    if (csrf) headers[CSRF_HEADER] = csrf;
  }
  return headers;
}

export async function api<T>(
  method: string,
  path: string,
  body?: unknown,
  retry = false,
): Promise<ApiResponse<T>> {
  const verb = method.toUpperCase();
  const isMutating = ["POST", "PUT", "DELETE", "PATCH"].includes(verb);
  const headers = authHeaders(isMutating, true);

  let res: Response;
  try {
    res = await fetch(API_BASE + path, {
      method: verb,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("NETWORK");
  }

  if (res.status === 401 && !retry) {
    const ok = await tryRefresh();
    if (ok) return api<T>(method, path, body, true);
    clearTokens();
    setStoredUser(null);
    redirectToLogin();
    throw new ApiError("UNAUTHORIZED", 401);
  }

  if (res.status === 204) {
    return { success: true };
  }

  let json: ApiResponse<T> | null = null;
  try {
    json = (await res.json()) as ApiResponse<T>;
  } catch {
    json = null;
  }

  if (!res.ok) {
    const msg = extractApiErrorMessage(json, res.status);
    const isBusinessError = res.status === 400 && /unpaid balance/i.test(msg);
    if (process.env.NODE_ENV === "development" && !isBusinessError) {
      console.error(
        `[API Error] ${res.status} ${method} ${API_BASE}${path}\n  Response: ${json ? JSON.stringify(json).slice(0, 500) : res.statusText}`,
      );
    }
    throw new ApiError(msg, res.status, parseFieldErrors(json), isBusinessError ? "business" : undefined);
  }
  return json ?? { success: true };
}

export const apiGet = <T>(path: string) => api<T>("GET", path);
export const apiPost = <T>(path: string, body?: unknown) => api<T>("POST", path, body);
export const apiPut = <T>(path: string, body?: unknown) => api<T>("PUT", path, body);
export const apiPatch = <T>(path: string, body?: unknown) => api<T>("PATCH", path, body);
export const apiDelete = <T>(path: string) => api<T>("DELETE", path);

export async function apiPostMultipart<T>(path: string, body: FormData): Promise<ApiResponse<T>> {
  const headers = authHeaders(true, false);
  let res: Response;
  try {
    res = await fetch(API_BASE + path, { method: "POST", headers, body });
  } catch {
    throw new ApiError("NETWORK");
  }
  if (res.status === 401) {
    const ok = await tryRefresh();
    if (ok) return apiPostMultipart<T>(path, body);
    clearTokens();
    setStoredUser(null);
    redirectToLogin();
    throw new ApiError("UNAUTHORIZED", 401);
  }
  let json: ApiResponse<T> | null = null;
  try {
    json = (await res.json()) as ApiResponse<T>;
  } catch {
    json = null;
  }
  if (!res.ok) {
    const msg = extractApiErrorMessage(json, res.status);
    const isBusinessError = res.status === 400 && /unpaid balance/i.test(msg);
    if (process.env.NODE_ENV === "development" && !isBusinessError) {
      console.error(
        `[API Error] ${res.status} POST ${API_BASE}${path}\n  Response: ${json ? JSON.stringify(json).slice(0, 500) : res.statusText}`,
      );
    }
    throw new ApiError(msg, res.status, parseFieldErrors(json), isBusinessError ? "business" : undefined);
  }
  return json ?? { success: true };
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function fmtMoney(n: unknown): string {
  return (
    "$" +
    Number(n ?? 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

export function qs(params: Record<string, string | number | boolean | null | undefined>): string {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    q.set(key, String(value));
  }
  const s = q.toString();
  return s ? "?" + s : "";
}
