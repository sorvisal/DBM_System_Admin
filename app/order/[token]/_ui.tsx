"use client";

import type { PublicProductDto } from "@/lib/types/customerOrderLink";
import { fmtMoney, uploadsUrl } from "@/lib/api/client";
import { Minus, Plus } from "lucide-react";

export const inputCls =
  "w-full h-11 rounded-xl border border-[#dbe5f2] bg-[#fbfdff] px-3 text-sm outline-none transition focus:border-[#0d63ff] focus:ring-2 focus:ring-blue-100";

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-[#4c6480]">{label}</span>
      {children}
    </label>
  );
}

export function EmptyState({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div className="py-16 text-center">
      <div className="mb-2 text-4xl">{icon}</div>
      <h3 className="text-sm font-bold text-slate-600">{title}</h3>
      <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
    </div>
  );
}

export function categoryIcon(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("water")) return "💧";
  if (n.includes("beer")) return "🍺";
  if (n.includes("juice")) return "🍊";
  if (n.includes("soft") || n.includes("drink") || n.includes("soda")) return "🥤";
  if (n.includes("snack")) return "🍿";
  if (n.includes("coffee") || n.includes("tea")) return "☕";
  if (n.includes("milk") || n.includes("dairy")) return "🥛";
  if (n.includes("bread") || n.includes("bakery")) return "🥖";
  return "📦";
}

export function ProductThumb({ p, className = "" }: { p: PublicProductDto; className?: string }) {
  return (
    <div className={`relative grid place-items-center overflow-hidden rounded-2xl bg-gradient-to-b from-[#eff6ff] to-[#e6f1ff] text-5xl ${className}`}>
      {p.photoPath
        ? <img src={uploadsUrl(p.photoPath)} alt={p.name} className="absolute inset-0 h-full w-full object-cover" />
        : "📦"}
      {!p.inStock && (
        <span className="absolute right-1.5 top-1.5 rounded-full bg-white/95 px-2 py-0.5 text-[9px] font-bold text-[#ef5b62] shadow-sm">
          Out of stock
        </span>
      )}
    </div>
  );
}

export function ProductCard({
  p, onAdd, onOpen,
}: {
  p: PublicProductDto;
  onAdd: () => void;
  onOpen?: () => void;
}) {
  return (
    <div className="flex min-w-0 flex-col rounded-[14px] border border-[#e2eaf6] bg-white p-2 shadow-[0_4px_12px_rgba(35,75,125,.06)]">
      <button onClick={onOpen} disabled={!onOpen} className="text-left disabled:cursor-default">
        <ProductThumb p={p} className="h-24 sm:h-28 md:h-32" />
      </button>
      <h4 className="mt-1.5 line-clamp-2 text-[11px] font-semibold leading-snug text-[#17304f] sm:text-[12px]">{p.name}</h4>
      <div className="mt-0.5 text-[9px] text-[#71829a] sm:text-[10px]">{p.sku}{p.categoryName ? ` · ${p.categoryName}` : ""}</div>
      <div className="mt-1 flex items-baseline justify-between">
        <span className="text-sm font-extrabold text-[#0d63ff]">{fmtMoney(p.price)}</span>
        <span className={`text-[9px] font-semibold sm:text-[10px] ${p.inStock ? "text-emerald-600" : "text-red-400"}`}>
          {p.inStock ? `${p.stockQty} left` : "—"}
        </span>
      </div>
      <button onClick={onAdd} disabled={!p.inStock}
        className="mt-1.5 flex h-7 items-center justify-center gap-1 rounded-lg bg-[#0d63ff] text-[10px] font-extrabold text-white transition-colors hover:bg-[#0b56e0] disabled:cursor-not-allowed disabled:opacity-40 sm:h-8 sm:text-[11px]">
        <Plus size={12} className="sm:size-13" /> Add
      </button>
    </div>
  );
}

export function QtyBtn({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-label={label}
      className="grid h-8 w-8 place-items-center rounded-lg border border-[#dae5f5] bg-white text-[#31577d] active:scale-95">
      {children}
    </button>
  );
}

export function Steps({ current }: { current: number }) {
  const steps = ["Cart", "Review", "Confirm", "Done"];
  return (
    <div className="flex justify-center gap-3 py-1 sm:gap-6">
      {steps.map((s, i) => (
        <div key={s} className={`flex items-center gap-1.5 text-[10px] sm:text-xs ${i <= current ? "font-bold text-[#0d63ff]" : "text-[#91a1b5]"}`}>
          <i className={`grid h-7 w-7 place-items-center rounded-full not-italic font-extrabold ${i < current ? "bg-emerald-100 text-emerald-600" : i === current ? "bg-[#0d63ff] text-white" : "bg-[#eef4fb] text-[#91a1b5]"}`}>
            {i < current ? "✓" : i + 1}
          </i>
          <span className="hidden sm:inline">{s}</span>
        </div>
      ))}
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const s = status.toLowerCase();
  const cls =
    s === "completed" || s === "confirmed"
      ? "bg-[#e8f9f1] text-[#15945b]"
      : s === "cancelled"
        ? "bg-[#fdebec] text-[#bd3944]"
        : s === "delivering"
          ? "bg-blue-50 text-[#0d63ff]"
          : "bg-[#fff6db] text-[#a46b00]";
  return <span className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${cls}`}>{status}</span>;
}

/**
 * Shared product-details modal — used by both Products and Home pages.
 */
export function ProductDetailsModal({
  product,
  qty,
  onClose,
  onQtyChange,
  onAddToCart,
}: {
  product: PublicProductDto;
  qty: number;
  onClose: () => void;
  onQtyChange: (n: number) => void;
  onAddToCart: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl max-h-[92vh] sm:max-h-auto flex flex-col"
      >
        {/* Scrollable content area */}
        <div className="overflow-y-auto flex-1">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-3 top-3 z-10 grid h-7 w-7 place-items-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/60"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          {/* Product image section */}
          <div className="relative flex h-44 w-full items-center justify-center overflow-hidden bg-gradient-to-b from-[#eff6ff] to-[#e6f1ff] sm:h-56 md:h-64">
            {product.photoPath ? (
              <img
                src={uploadsUrl(product.photoPath)}
                alt={product.name}
                className="h-full w-full object-contain p-4"
              />
            ) : (
              <span className="text-6xl sm:text-7xl">📦</span>
            )}
          </div>

          {/* Product info section */}
          <div className="p-4 sm:p-5">
            <h2 className="text-base font-extrabold text-[#17304f] sm:text-lg">{product.name}</h2>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#71829a]">
              <span>SKU: {product.sku}</span>
              {product.categoryName && (
                <span className="rounded-full bg-[#eef4fb] px-2 py-0.5 font-semibold text-[#0d63ff]">
                  {product.categoryName}
                </span>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-xl font-extrabold text-[#0d63ff] sm:text-2xl">{fmtMoney(product.price)}</span>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                  product.inStock
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-red-50 text-red-400"
                }`}
              >
                {product.inStock ? `${product.stockQty} in stock` : "Out of stock"}
              </span>
            </div>

            {product.description && (
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                {product.description}
              </p>
            )}

            {/* Quantity selector and add-to-cart button */}
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center justify-center gap-2 rounded-xl border border-[#dae5f5] px-2 py-1.5 sm:justify-start">
                <QtyBtn
                  label="Decrease quantity"
                  onClick={() => onQtyChange(Math.max(1, qty - 1))}
                >
                  <Minus size={14} />
                </QtyBtn>
                <span className="w-8 text-center text-sm font-bold text-[#17304f]">{qty}</span>
                <QtyBtn
                  label="Increase quantity"
                  onClick={() => onQtyChange(Math.min(product.stockQty || 1, qty + 1))}
                >
                  <Plus size={14} />
                </QtyBtn>
              </div>

              <button
                disabled={!product.inStock}
                onClick={onAddToCart}
                className="rounded-xl bg-gradient-to-r from-[#0d63ff] to-[#1a71ff] px-4 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 w-full sm:w-auto"
              >
                Add {qty} to cart — {fmtMoney(product.price * qty)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
