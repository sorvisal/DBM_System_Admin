"use client";

import { useEffect, useState } from "react";
import { usePortal } from "../portal-context";
import { EmptyState, ProductCard, ProductDetailsModal, categoryIcon, inputCls } from "../_ui";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import { useToast } from "@/components/toast";

export default function ProductsPage() {
  const {
    products, productsLoading, categories,
    activeCategory, setActiveCategory, search, setSearch, refreshProducts,
    addToCart, productMap,
  } = usePortal();
  const { toast } = useToast();

  const [detailId, setDetailId] = useState<number | null>(null);
  const [detailQty, setDetailQty] = useState(1);
  const detail = detailId != null ? productMap.get(detailId) ?? null : null;

  // re-query whenever the category chip changes
  useEffect(() => {
    refreshProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  function openDetail(p: (typeof products)[number]) {
    setDetailQty(1);
    setDetailId(p.id);
  }

  function handleAddToCart() {
    if (!detail) return;
    addToCart(detail, detailQty);
    toast(`${detailQty} × ${detail.name} added to cart`, "ok");
    setDetailId(null);
  }

  return (
    <div className="mx-auto max-w-5xl pb-20 md:pb-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") refreshProducts(); }}
          placeholder="Search by product name…"
          className={`${inputCls} pl-10 pr-20 sm:pr-24`}
        />
        <button onClick={() => refreshProducts()}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 sm:h-8 rounded-lg bg-[#0d63ff] px-2.5 sm:px-3 text-[10px] sm:text-xs font-bold text-white hover:bg-[#0b56e0]">
          Search
        </button>
      </div>

      {/* Category chips */}
      <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
        <Chip active={activeCategory == null} onClick={() => setActiveCategory(null)}>All</Chip>
        {categories.map((c) => (
          <Chip key={c.id} active={activeCategory === c.id} onClick={() => setActiveCategory(c.id)}>
            <span className="mr-0.5">{categoryIcon(c.name)}</span> {c.name}
          </Chip>
        ))}
      </div>

      {/* Grid */}
      {productsLoading ? (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl sm:h-56 sm:rounded-[18px]" />)}
        </div>
      ) : products.length === 0 ? (
        <EmptyState icon="🔍" title="No products found"
          subtitle={search ? `Nothing matches "${search}".` : "Try another category."} />
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((p) => (
            <ProductCard key={p.id} p={p} onOpen={() => openDetail(p)}
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

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`whitespace-nowrap rounded-full border px-3.5 py-2 text-xs font-bold transition-colors ${
        active ? "border-[#0d63ff] bg-[#0d63ff] text-white" : "border-[#e2eaf6] bg-white text-[#426084] hover:border-blue-300"
      }`}>
      {children}
    </button>
  );
}
