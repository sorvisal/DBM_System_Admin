"use client";

import { useEffect, useState } from "react";
import { getCustomer } from "@/lib/api/customers";
import type { CustomerDetailDto } from "@/lib/types";
import { Badge, esc, fmtDate } from "@/components/ui";
import { uploadsUrl } from "@/lib/api";
import { useModal, type ModalRecord, registerModalSlot } from "@/components/ui/Modal";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function CustomerModal({ data }: { data: ModalRecord }) {
  const { close } = useModal();
  const customerId = typeof data.id === "number" ? data.id : null;
  const [customer, setCustomer] = useState<CustomerDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!customerId) return;
    getCustomer(customerId)
      .then((r) => setCustomer(r.data ?? null))
      .catch((err) => setError(err instanceof Error ? err.message : "Load failed"))
      .finally(() => setLoading(false));
  }, [customerId]);

  return (
    <Dialog open={!!customer || loading} onOpenChange={(v) => { if (!v) close(); }}>
      {loading && <p className="p-4 text-sm text-slate-500">Loading…</p>}
      {error && <p className="p-4 text-sm text-red-500">{error}</p>}
      {customer && !loading && (
        <>
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] mb-1">Customer</p>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">{esc(customer.customer.name)}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Customer since {fmtDate(customer.customer.createdAt)}</p>
          </div>
          <div className="px-5 py-4 space-y-4">
            <div className="flex items-start gap-4">
              {customer.customer.photoPath ? (
                <img src={uploadsUrl(customer.customer.photoPath)} alt="" className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-500 flex-shrink-0">
                  {esc((customer.customer.name ?? "").slice(0, 2).toUpperCase())}
                </div>
              )}
              <div className="flex-1 text-sm space-y-1">
                <div><span className="text-slate-500 dark:text-slate-400">Phone: </span><span className="font-mono">{esc(customer.customer.phone ?? "—")}</span></div>
                <div><span className="text-slate-500 dark:text-slate-400">Address: </span><span className="max-w-xs truncate">{esc(customer.customer.address ?? "—")}</span></div>
                <div><span className="text-slate-500 dark:text-slate-400">Status: </span><Badge variant={customer.customer.status === "active" ? "ok" : "warn"}>{customer.customer.status}</Badge></div>
                {customer.customer.customerTypeName && (
                  <div><span className="text-slate-500 dark:text-slate-400">Type: </span><span className="font-medium">{esc(customer.customer.customerTypeName)}</span></div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total Spent</div>
                <div className="text-lg font-bold">${customer.stats.totalSpent.toFixed(2)}</div>
              </div>
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Balance</div>
                <div className={`text-lg font-bold ${customer.stats.balance > 0 ? "text-red-500" : ""}`}>
                  ${customer.stats.balance.toFixed(2)}
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Orders</div>
                <div className="text-lg font-bold">{customer.stats.orderCount}</div>
              </div>
            </div>
          </div>
          <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
            <Button variant="ghost" onClick={close}>Close</Button>
          </div>
        </>
      )}
    </Dialog>
  );
}

let registered = false;
if (typeof window !== "undefined" && !registered) {
  registered = true;
  registerModalSlot("customer", (data: ModalRecord) => <CustomerModal data={data} />);
}

export { CustomerModal };
export default CustomerModal;
