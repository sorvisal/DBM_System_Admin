"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePortal } from "../portal-context";
import { EmptyState, ProductCard, ProductDetailsModal, categoryIcon } from "../_ui";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/toast";

export default function HomePage() {
  const {
    categories, products, productsLoading,
    addToCart, setActiveCategory, productMap,
  } = usePortal();
  const { toast } = useToast();
  const router = useRouter();
  const base = `/order/${usePortal().token}`;

  const popular = products.slice(0, 8);

  const [detailId, setDetailId] = useState<number | null>(null);
  const [detailQty, setDetailQty] = useState(1);
  const detail = detailId != null ? productMap.get(detailId) ?? null : null;

  function handleAddToCart() {
    if (!detail) return;
    addToCart(detail, detailQty);
    toast(`${detailQty} × ${detail.name} added to cart`, "ok");
    setDetailId(null);
  }

  return (
    <div className="mx-auto max-w-5xl pb-20 md:pb-6">
      {/* Hero */}
      <div className="overflow-hidden rounded-2xl sm:rounded-3xl border border-[#dbeaff] bg-gradient-to-br from-[#e8f3ff] to-white p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-xl font-extrabold text-[#1049ab] sm:text-2xl md:text-3xl">Welcome to DBM Retailer</h1>
            <p className="mt-1 text-sm text-[#71829a]">
              Browse products, build a multi-product order, and track your purchases.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5 sm:gap-2">
              <span className="rounded-full border border-[#dce9fc] bg-white px-2.5 py-1 text-[10px] text-[#416287] sm:text-[11px]">📦 Multiple products</span>
              <span className="rounded-full border border-[#dce9fc] bg-white px-2.5 py-1 text-[10px] text-[#416287] sm:text-[11px]">🔐 Secure account</span>
              <span className="rounded-full border border-[#dce9fc] bg-white px-2.5 py-1 text-[10px] text-[#416287] sm:text-[11px]">🚚 Delivery ordering</span>
            </div>
          </div>
          <div className="flex-shrink-0 grid h-24 w-28 place-items-center rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#cfe7ff] to-[#f5fbff] text-5xl sm:h-32 sm:w-40">
            🏭
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="mb-1 mt-5 flex items-center justify-between sm:mt-6">
        <h3 className="text-sm font-bold sm:text-base">Product Categories</h3>
        <button onClick={() => router.push(`${base}/products`)} className="text-xs font-semibold text-[#0d63ff] hover:underline">
          View all
        </button>
      </div>
      {productsLoading && categories.length === 0 ? (
        <div className="mt-2 grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl sm:h-16 sm:rounded-2xl" />)}
        </div>
      ) : (
        <div className="mt-2 grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4">
          {(categories.length > 0 ? categories : []).slice(0, 8).map((c) => (
            <button key={c.id}
              onClick={() => { setActiveCategory(c.id); router.push(`${base}/products`); }}
              className="flex min-w-0 items-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border border-[#e2eaf6] bg-white p-2.5 sm:p-3 text-left transition-shadow hover:shadow-md">
              <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg sm:rounded-xl bg-[#eaf3ff] text-xl sm:text-2xl">
                {categoryIcon(c.name)}
              </span>
              <span className="min-w-0">
                <strong className="block truncate text-xs sm:text-sm">{c.name}</strong>
                <small className="block text-[9px] text-[#71829a] sm:text-[10px]">{c.productCount} products</small>
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Popular products */}
      <div className="mb-1 mt-5 flex items-center justify-between sm:mt-7">
        <h3 className="text-sm font-bold sm:text-base">Popular Products</h3>
        <button onClick={() => router.push(`${base}/products`)} className="text-xs font-semibold text-[#0d63ff] hover:underline">
          See more
        </button>
      </div>
      {productsLoading && products.length === 0 ? (
        <div className="mt-2 grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl sm:h-56 sm:rounded-[18px]" />)}
        </div>
      ) : popular.length === 0 ? (
        <EmptyState icon="📦" title="No products yet" subtitle={`This store hasn't published products yet.`} />
      ) : (
        <div className="mt-2 grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {popular.map((p) => (
            <ProductCard key={p.id} p={p}
              onOpen={() => { setDetailQty(1); setDetailId(p.id); }}
              onAdd={() => { addToCart(p); toast(`${p.name} added to cart`, "ok"); }} />
          ))}
        </div>
      )}

      {detail && (
        <ProductDetailsModal
          product={detail}
          qty={detailQty}
          onClose={() => setDetailId(null)}
          onQtyChange={setDetailQty}
          onAddToCart={handleAddToCart}
        />
      )}
    </div>
  );
}
