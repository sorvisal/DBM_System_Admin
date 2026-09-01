"use client";

import { API_BASE } from "./client";
import type { ApiResponse } from "@/lib/types/common";
import type {
  CartLineRequest,
  CustomerAuthResponse,
  PublicCategoryDto,
  PublicCheckoutRequest,
  PublicCustomerOrderInfoDto,
  PublicOrderDto,
  PublicProductDto,
  PublicOrdersPageDto,
  ValidateCartResponseDto,
} from "@/lib/types/customerOrderLink";

// ---------------------------------------------------------------------------
// Customer session storage — scoped per ordering link so sessions never mix.
// ---------------------------------------------------------------------------

const storageKey = (token: string) => `dbm_customer_session_${token}`;

export function saveCustomerSession(linkToken: string, auth: CustomerAuthResponse) {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(linkToken), JSON.stringify(auth));
}

export function loadCustomerSession(linkToken: string): CustomerAuthResponse | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(linkToken));
    return raw ? (JSON.parse(raw) as CustomerAuthResponse) : null;
  } catch {
    return null;
  }
}

export function clearCustomerSession(linkToken: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(storageKey(linkToken));
}

// ---------------------------------------------------------------------------
// Raw fetch wrapper — deliberately NOT the admin api() client:
// no Authorization header, no redirect-to-login on 401.
// ---------------------------------------------------------------------------

export class PublicApiError extends Error {
  kind: "network" | "api";
  constructor(message: string, kind: "network" | "api" = "api") {
    super(message);
    this.kind = kind;
    this.name = "PublicApiError";
  }
}

async function publicFetch<T>(
  method: string,
  path: string,
  body?: unknown,
  customerToken?: string | null,
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (customerToken) headers["X-Customer-Token"] = customerToken;

  let res: Response;
  try {
    res = await fetch(API_BASE + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new PublicApiError("Network error. Please check your connection.", "network");
  }

  let json: ApiResponse<T> | null = null;
  try {
    json = (await res.json()) as ApiResponse<T>;
  } catch {
    json = null;
  }

  if (!res.ok || !json?.success) {
    throw new PublicApiError(json?.error || `Request failed (${res.status}).`);
  }
  return json;
}

// ---------------------------------------------------------------------------
// Public endpoints
// ---------------------------------------------------------------------------

export function getPublicOrderInfo(token: string) {
  return publicFetch<PublicCustomerOrderInfoDto>("GET", `/public/customer-orders/${encodeURIComponent(token)}`);
}

export function getPublicCategories(token: string) {
  return publicFetch<PublicCategoryDto[]>("GET", `/public/customer-orders/${encodeURIComponent(token)}/categories`);
}

export function getPublicProducts(token: string, categoryId?: number, search?: string) {
  const params = new URLSearchParams();
  if (categoryId) params.set("categoryId", String(categoryId));
  if (search) params.set("search", search);
  const query = params.toString();
  return publicFetch<PublicProductDto[]>(
    "GET",
    `/public/customer-orders/${encodeURIComponent(token)}/products${query ? `?${query}` : ""}`,
  );
}

export function publicRegister(
  token: string,
  body: { name: string; phone: string; email: string; password: string; confirmPassword: string },
) {
  return publicFetch<CustomerAuthResponse>("POST", `/public/customer-orders/${encodeURIComponent(token)}/register`, body);
}

export function publicLogin(
  token: string,
  body: { identifier: string; password: string; rememberMe: boolean },
) {
  return publicFetch<CustomerAuthResponse>("POST", `/public/customer-orders/${encodeURIComponent(token)}/login`, body);
}

export function publicGoogleLogin(
  token: string,
  body: { idToken: string },
) {
  return publicFetch<CustomerAuthResponse>("POST", `/public/customer-orders/${encodeURIComponent(token)}/google`, body);
}

export function publicTelegramLogin(
  token: string,
  body: { telegramAuth: string },
) {
  return publicFetch<CustomerAuthResponse>("POST", `/public/customer-orders/${encodeURIComponent(token)}/telegram`, body);
}

export function publicValidateCart(token: string, items: CartLineRequest[]) {
  return publicFetch<ValidateCartResponseDto>("POST", `/public/customer-orders/${encodeURIComponent(token)}/validate-cart`, { items });
}

export function publicCheckout(token: string, body: PublicCheckoutRequest, customerToken?: string | null) {
  return publicFetch<PublicOrderDto>("POST", `/public/customer-orders/${encodeURIComponent(token)}/checkout`, body, customerToken);
}

export function publicMyOrders(token: string, customerToken?: string | null) {
  return publicFetch<PublicOrderDto[]>("GET", `/public/customer-orders/${encodeURIComponent(token)}/orders`, undefined, customerToken);
}

/** Paged + filtered order history for the signed-in customer (server-side pagination). */
export function publicMyOrdersPaged(
  token: string,
  params: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  },
  customerToken?: string | null,
) {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.pageSize) qs.set("pageSize", String(params.pageSize));
  if (params.search) qs.set("search", params.search);
  if (params.status) qs.set("status", params.status);
  if (params.dateFrom) qs.set("dateFrom", params.dateFrom);
  if (params.dateTo) qs.set("dateTo", params.dateTo);
  const query = qs.toString();
  return publicFetch<PublicOrdersPageDto>(
    "GET",
    `/public/customer-orders/${encodeURIComponent(token)}/orders${query ? `?${query}` : ""}`,
    undefined,
    customerToken,
  );
}
