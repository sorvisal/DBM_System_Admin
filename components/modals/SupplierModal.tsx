"use client";

import { useEffect, useState } from "react";
import { getSupplier } from "@/lib/api/suppliers";
import type { SupplierDto } from "@/lib/types";
import { esc } from "@/components/ui";
import { useModal, type ModalRecord, registerModalSlot } from "@/components/ui/Modal";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function SupplierModal({ data }: { data: ModalRecord }) {
  const { close } = useModal();
  const id = typeof data.id === "number" ? data.id : null;
  const [supplier, setSupplier] = useState<SupplierDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    getSupplier(id)
      .then((r) => setSupplier(r.data ?? null))
      .catch((err) => setError(err instanceof Error ? err.message : "Load failed"))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <Dialog open={!!supplier || loading} onOpenChange={(v) => { if (!v) close(); }}>
      {loading && <p className="p-4 text-sm text-slate-500">Loading…</p>}
      {error && <p className="p-4 text-sm text-red-500">{error}</p>}
      {supplier && !loading && (
        <>
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] mb-1">Supplier</p>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">{esc(supplier.name)}</h2>
          </div>
          <div className="px-5 py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Contact Person</div>
                <div className="font-medium">{esc(supplier.contactPerson ?? "—")}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Phone</div>
                <div className="font-mono text-xs">{esc(supplier.phone ?? "—")}</div>
              </div>
              <div className="col-span-2">
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Address</div>
                <div>{esc(supplier.address ?? "—")}</div>
              </div>
              {supplier.description && (
                <div className="col-span-2 text-xs text-slate-500 dark:text-slate-400">
                  {esc(supplier.description)}
                </div>
              )}
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
  registerModalSlot("supplier", (data: ModalRecord) => <SupplierModal data={data} />);
}

export { SupplierModal };
export default SupplierModal;
