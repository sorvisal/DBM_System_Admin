"use client";

import { useRouter } from "next/navigation";
import { usePortal } from "../portal-context";
import { EmptyState, QtyBtn, Steps } from "../_ui";
import { fmtMoney, uploadsUrl } from "@/lib/api/client";
import { ArrowRight, Minus, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/components/toast";

export default function CartPage() {
  const { cart, productMap, changeQty, removeFromCart, clearCart, totalQty, cartTotal } = usePortal();
  const router = useRouter();
  const base = `/order/${usePortal().token}`;
  const { toast } = useToast();

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-3xl pb-20 md:pb-6">
        <Steps current={0} />
        <div className="mt-3 rounded-2xl border border-[#e2eaf6] bg-white">
          <EmptyState icon="🛒" title="Your cart is empty" subtitle="Browse products and add what you need." />
          <div className="pb-4 pt-2 text-center sm:pb-6">
            <button onClick={() => router.push(`${base}/products`)}
              className="h-10 rounded-xl bg-gradient-to-r from-[#0d63ff] to-[#1a71ff] px-6 text-sm font-bold text-white sm:h-11">
              Browse products
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
        <div className="mx-auto max-w-3xl pb-20 md:pb-6">
      <Steps current={0} />

        <div className="mt-3 grid gap-3 sm:gap-4 md:grid-cols-[1.1fr_.9fr]">
        {/* Items */}
        <div className="divide-y divide-[#eef2f7] rounded-2xl border border-[#e2eaf6] bg-white">
          {cart.map((item) => {
            const p = productMap.get(item.productId);
            if (!p) return null;
            return (
              <div key={item.productId} className="p-3 sm:p-3.5">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="grid h-10 w-10 flex-shrink-0 place-items-center overflow-hidden rounded-xl bg-[#eff6ff] text-xl sm:h-12 sm:w-12 sm:text-2xl">
                    {p.photoPath
                      ? <img src={uploadsUrl(p.photoPath)} alt="" className="h-full w-full object-cover" />
                      : "📦"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold">{p.name}</div>
                    <div className="text-xs text-[#71829a]">{fmtMoney(p.price)} × {item.qty}</div>
                  </div>
                  <div className="flex-shrink-0 text-sm font-extrabold sm:text-base">{fmtMoney(p.price * item.qty)}</div>
                  <button onClick={() => { removeFromCart(item.productId); toast(`${p.name} removed`, "info"); }}
                    aria-label={`Remove ${p.name}`}
                    className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500 sm:h-8 sm:w-8">
                    <Trash2 size={14} className="sm:size-15" />
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-end gap-1.5">
                  <QtyBtn label="Decrease quantity" onClick={() => changeQty(item.productId, -1, p.stockQty)}>
                    <Minus size={14} />
                  </QtyBtn>
                  <span className="w-8 text-center text-sm font-extrabold">{item.qty}</span>
                  <QtyBtn label="Increase quantity" onClick={() => changeQty(item.productId, 1, p.stockQty)}>
                    <Plus size={14} />
                  </QtyBtn>
                </div>
              </div>
            );
          })}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 sm:p-3.5">
            <button onClick={() => { if (confirm("Remove all items from your cart?")) clearCart(); }}
              className="text-xs font-semibold text-[#ef5b62] hover:underline">
              Clear cart
            </button>
            <div className="text-right">
              <div className="text-xs text-[#71829a]">{totalQty} item{totalQty === 1 ? "" : "s"} · subtotal</div>
              <div className="text-lg font-black text-[#1255bc] sm:text-xl">{fmtMoney(cartTotal)}</div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="self-start rounded-2xl border border-[#e2eaf6] bg-white p-3.5 sm:p-4">
          <h3 className="mb-2.5 text-sm font-extrabold sm:mb-3">Order Summary</h3>
          <Row label={`Subtotal (${totalQty} items)`} value={fmtMoney(cartTotal)} />
          <Row label="Delivery" value="Calculated at confirmation" muted />
          <div className="mt-2.5 flex items-center justify-between border-t border-dashed border-[#dce4ee] pt-2.5 sm:mt-3 sm:pt-3">
            <span className="font-extrabold">Total</span>
            <span className="text-lg font-black text-[#0e50b4] sm:text-xl">{fmtMoney(cartTotal)}</span>
          </div>
          <button onClick={() => router.push(`${base}/checkout`)}
            className="mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#0d63ff] to-[#1a71ff] text-sm font-bold text-white hover:opacity-95 sm:h-12 sm:gap-2">
            Continue to checkout <ArrowRight size={15} className="sm:size-16" />
          </button>
          <p className="mt-2.5 rounded-xl bg-[#eff7ff] px-3 py-1.5 text-[10px] leading-relaxed text-[#50709a] sm:mt-3 sm:text-[11px]">
            You can order multiple different products in one order.
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex justify-between py-1.5 text-sm">
      <span className={muted ? "text-slate-400" : ""}>{label}</span>
      <b>{value}</b>
    </div>
  );
}
