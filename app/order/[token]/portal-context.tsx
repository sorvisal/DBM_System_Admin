"use client";

import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from "react";
import type { ReactNode } from "react";
import {
  clearCustomerSession,
  getPublicCategories,
  getPublicOrderInfo,
  getPublicProducts,
  loadCustomerSession,
  saveCustomerSession,
  PublicApiError,
} from "@/lib/api/publicCustomerOrders";
import {
  setCurrentOrderToken,
  clearCurrentOrderToken,
} from "@/lib/orderToken";
import type { CustomerAuthResponse } from "@/lib/types/customerOrderLink";
import type {
  PublicCategoryDto,
  PublicCustomerOrderInfoDto,
  PublicOrderDto,
  PublicProductDto,
} from "@/lib/types/customerOrderLink";

export interface CartItem {
  productId: number;
  qty: number;
}

type PortalStatus = "loading" | "invalid" | "error" | "ready";

interface PortalContextValue {
  token: string;
  status: PortalStatus;
  error: string | null;
  info: PublicCustomerOrderInfoDto | null;
  storeName: string;

  session: CustomerAuthResponse | null;
  signIn: (auth: CustomerAuthResponse) => void;
  signOut: () => void;

  categories: PublicCategoryDto[];
  products: PublicProductDto[];
  productsLoading: boolean;
  refreshProducts: () => Promise<void>;
  activeCategory: number | null;
  setActiveCategory: (id: number | null) => void;
  search: string;
  setSearch: (s: string) => void;

  cart: CartItem[];
  addToCart: (p: PublicProductDto, qty?: number) => void;
  changeQty: (productId: number, delta: number, maxStock?: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
  totalQty: number;
  cartTotal: number;
  productMap: Map<number, PublicProductDto>;

  lastOrder: PublicOrderDto | null;
  setLastOrder: React.Dispatch<React.SetStateAction<PublicOrderDto | null>>;
  retryValidation: () => void;
}

const PortalContext = createContext<PortalContextValue | null>(null);

const cartKey = (token: string) => `dbm_order_cart_${token}`;

export function PortalProvider({ token, children }: { token: string; children: ReactNode }) {
  const [status, setStatus] = useState<PortalStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<PublicCustomerOrderInfoDto | null>(null);
  const [session, setSession] = useState<CustomerAuthResponse | null>(null);

  const [categories, setCategories] = useState<PublicCategoryDto[]>([]);
  const [products, setProducts] = useState<PublicProductDto[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [lastOrder, setLastOrder] = useState<PublicOrderDto | null>(null);

  // ---- boot: validate the token, restore session + cart --------------------
  const validateToken = useCallback(async () => {
    const alive = { current: true };
    try {
      const json = await getPublicOrderInfo(token);
      if (!alive.current) return;
      if (!json.success || !json.data || !json.data.isValid) {
        clearCurrentOrderToken();
        setStatus("invalid");
        return;
      }
      setCurrentOrderToken(token);
      setInfo(json.data);
      const saved = loadCustomerSession(token);
      if (saved?.accessToken && new Date(saved.expiresAt) > new Date()) setSession(saved);
      try {
        const raw = localStorage.getItem(cartKey(token));
        if (raw) setCart(JSON.parse(raw) as CartItem[]);
      } catch { /* ignore corrupt cart */ }
      setStatus("ready");
    } catch (err: unknown) {
      if (!alive.current) return;
      if (err instanceof PublicApiError && err.kind === "network") {
        setError(err.message);
        setStatus("error");
      } else {
        clearCurrentOrderToken();
        setStatus("invalid");
      }
    }
  }, [token]);

  useEffect(() => {
    validateToken();
  }, [validateToken]);

  const retryValidation = useCallback(() => {
    setError(null);
    setStatus("loading");
    validateToken();
  }, [validateToken]);

  // persist cart per link token (survives login/register and page navigation)
  useEffect(() => {
    if (status !== "ready") return;
    try { localStorage.setItem(cartKey(token), JSON.stringify(cart)); } catch { /* ignore */ }
  }, [cart, token, status]);

  // ---- catalog -------------------------------------------------------------
  useEffect(() => {
    if (status !== "ready") return;
    let alive = true;
    (async () => {
      setProductsLoading(true);
      try {
        const [catsJson, prodsJson] = await Promise.all([
          getPublicCategories(token),
          getPublicProducts(token),
        ]);
        if (!alive) return;
        setCategories(catsJson.data ?? []);
        setProducts(prodsJson.data ?? []);
      } catch { /* surfaced per page */ } finally {
        if (alive) setProductsLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [status, token]);

  const refreshProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const prodsJson = await getPublicProducts(
        token,
        activeCategory ?? undefined,
        search.trim() || undefined,
      );
      setProducts(prodsJson.data ?? []);
    } finally {
      setProductsLoading(false);
    }
  }, [token, activeCategory, search]);

  // ---- cart ----------------------------------------------------------------
  const addToCart = useCallback((p: PublicProductDto, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === p.id);
      const current = existing?.qty ?? 0;
      if (current + qty > p.stockQty) return existing
        ? prev.map((i) => (i.productId === p.id ? { ...i, qty: p.stockQty } : i))
        : [...prev, { productId: p.id, qty: Math.min(qty, Math.max(p.stockQty, 1)) }];
      return existing
        ? prev.map((i) => (i.productId === p.id ? { ...i, qty: i.qty + qty } : i))
        : [...prev, { productId: p.id, qty }];
    });
  }, []);

  const changeQty = useCallback((productId: number, delta: number, maxStock?: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.productId !== productId) return i;
          const next = i.qty + delta;
          if (maxStock != null && next > maxStock) return i;
          return { ...i, qty: next };
        })
        .filter((i) => i.qty > 0),
    );
  }, []);

  const removeFromCart = useCallback((productId: number) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const totalQty = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + (productMap.get(i.productId)?.price ?? 0) * i.qty, 0);

  // ---- session -------------------------------------------------------------
  const signIn = useCallback((auth: CustomerAuthResponse) => {
    saveCustomerSession(token, auth);
    setSession(auth);
  }, [token]);

  const signOut = useCallback(() => {
    clearCustomerSession(token);
    setSession(null);
  }, [token]);

  const value = useMemo<PortalContextValue>(() => ({
    token,
    status,
    error,
    info,
    storeName: info?.name || info?.organizationName || "DBM Retailer",
    session,
    signIn,
    signOut,
    categories,
    products,
    productsLoading,
    refreshProducts,
    activeCategory,
    setActiveCategory,
    search,
    setSearch,
    cart,
    addToCart,
    changeQty,
    removeFromCart,
    clearCart,
    totalQty,
    cartTotal,
    productMap,
    lastOrder,
    setLastOrder,
    retryValidation,
  }), [
    token, status, error, info, session, signIn, signOut, categories, products, productsLoading,
    refreshProducts, activeCategory, search, cart, addToCart, changeQty, removeFromCart,
    clearCart, totalQty, cartTotal, productMap, lastOrder, retryValidation,
  ]);

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}

export function usePortal(): PortalContextValue {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error("usePortal must be used within <PortalProvider>");
  return ctx;
}
