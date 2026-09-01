"use client";

import type { PublicOrderHistoryDto } from "@/lib/types/customerOrderLink";
import { fmtMoney, uploadsUrl } from "@/lib/api/client";

export function OrderItems({ order }: { order: PublicOrderHistoryDto }) {
  return (
    <div className="rounded-2xl border border-[#e2eaf6] bg-white p-4">
      <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
        Items ({order.lines.length})
      </h4>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {order.lines.map((l) => (
          <div key={l.productId} className="flex gap-3 rounded-xl border border-slate-100 p-2.5">
            <div className="grid h-12 w-12 flex-shrink-0 place-items-center overflow-hidden rounded-xl bg-[#eff6ff] text-xl">
              {l.photoPath ? <img src={uploadsUrl(l.photoPath)} alt="" className="h-full w-full object-cover" /> : "📦"}
            </div>
            <div className="min-w-0 flex-1 text-sm">
              <div className="truncate font-bold">{l.productName}</div>
              {l.sku && <div className="text-xs text-slate-400">SKU: {l.sku}</div>}
              <div className="mt-0.5 text-xs text-slate-500">
                Qty {l.qty} × {fmtMoney(l.unitPrice)}
              </div>
              {(l.batchNumber || l.manufactureDate || l.expiryDate) && (
                <div className="mt-1 space-y-0.5 text-[11px] text-slate-400">
                  {l.batchNumber && <div>Batch: {l.batchNumber}</div>}
                  {l.manufactureDate && <div>MFG: {new Date(l.manufactureDate).toLocaleDateString()}</div>}
                  {l.expiryDate && <div>EXP: {new Date(l.expiryDate).toLocaleDateString()}</div>}
                </div>
              )}
              <div className="mt-1 font-bold text-[#1255bc]">{fmtMoney(l.lineTotal)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
              <th className="pb-2 pr-3 font-semibold">Product</th>
              <th className="pb-2 pr-3 font-semibold">Batch</th>
              <th className="pb-2 pr-3 font-semibold">MFG / EXP</th>
              <th className="pb-2 pr-3 text-right font-semibold">Qty</th>
              <th className="pb-2 pr-3 text-right font-semibold">Unit</th>
              <th className="pb-2 text-right font-semibold">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {order.lines.map((l) => (
              <tr key={l.productId} className="align-top">
                <td className="py-2.5 pr-3">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-10 w-10 flex-shrink-0 place-items-center overflow-hidden rounded-lg bg-[#eff6ff] text-lg">
                      {l.photoPath ? <img src={uploadsUrl(l.photoPath)} alt="" className="h-full w-full object-cover" /> : "📦"}
                    </span>
                    <span>
                      <span className="block font-bold">{l.productName}</span>
                      {l.sku && <span className="block text-xs text-slate-400">SKU: {l.sku}</span>}
                      {!l.productIsActive && <span className="block text-[11px] text-amber-600">no longer listed</span>}
                    </span>
                  </div>
                </td>
                <td className="py-2.5 pr-3 text-slate-500">
                  {l.batchNumber ?? "—"}
                  {!l.batchNumber && !l.manufactureDate && !l.expiryDate ? "" : (
                    <span className="block text-xs">
                      {l.manufactureDate && <>MFG {new Date(l.manufactureDate).toLocaleDateString()}<br /></>}
                      {l.expiryDate && <>EXP {new Date(l.expiryDate).toLocaleDateString()}</>}
                    </span>
                  )}
                </td>
                <td className="hidden py-2.5" />
                <td className="py-2.5 pr-3 text-right font-semibold">{l.qty}</td>
                <td className="py-2.5 pr-3 text-right">{fmtMoney(l.unitPrice)}</td>
                <td className="py-2.5 text-right font-bold text-[#1255bc]">{fmtMoney(l.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Discount is not part of the current order model — shown only when the store adds one. */}
    </div>
  );
}
