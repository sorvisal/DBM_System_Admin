"use client";

import { useEffect, useState } from "react";
import { getCategory } from "@/lib/api/categories";
import type { CategoryDto } from "@/lib/types";
import { esc } from "@/components/ui";
import { useModal, type ModalRecord, registerModalSlot } from "@/components/ui/Modal";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function CategoryModal({ data }: { data: ModalRecord }) {
  const { close } = useModal();
  const id = typeof data.id === "number" ? data.id : null;
  const [category, setCategory] = useState<CategoryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    getCategory(id)
      .then((r) => setCategory(r.data ?? null))
      .catch((err) => setError(err instanceof Error ? err.message : "Load failed"))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <Dialog open={!!category || loading} onOpenChange={(v) => { if (!v) close(); }}>
      {loading && <p className="p-4 text-sm text-slate-500">Loading…</p>}
      {error && <p className="p-4 text-sm text-red-500">{error}</p>}
      {category && !loading && (
        <>
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] mb-1">Category</p>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">{esc(category.name)}</h2>
          </div>
          <div className="px-5 py-4">
            {category.description ? (
              <p className="text-sm text-slate-600 dark:text-slate-400">{esc(category.description)}</p>
            ) : (
              <p className="text-sm text-slate-400 dark:text-slate-500 italic">No description</p>
            )}
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
  registerModalSlot("category", (data: ModalRecord) => <CategoryModal data={data} />);
}

export { CategoryModal };
export default CategoryModal;
