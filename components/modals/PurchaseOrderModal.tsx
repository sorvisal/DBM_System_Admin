"use client";

import { useState, useEffect, useCallback } from "react";
import { createPurchaseOrder } from "@/lib/api/purchaseOrders";
import { listProducts } from "@/lib/api/products";
import { useSuppliers } from "@/lib/hooks/useSuppliers";
import type { ProductDto, PurchaseCreateRequest } from "@/lib/types";
import { esc } from "@/components/ui";
import { useToast } from "@/components/toast";
import { useModal, type ModalRecord, registerModalSlot } from "@/components/ui/Modal";
import { X, Plus, Loader2 } from "lucide-react";

// ─── Line item type ───────────────────────────────────────────────────────────

interface POLine {
  productId: number;
  qty: number;
  manufactureDate: string;
  expiryDate: string;
}

// Shared column template so the header row and every line row align.
// Mobile (default): 3-col — product + qty/removal on first row, dates on second.
// Small+ (sm): 5-col — all fields in one row.
const LINE_ROWS =
  "grid grid-cols-[1fr_72px_auto] gap-3 sm:grid-cols-[minmax(0,1.7fr)_80px_minmax(0,1fr)_minmax(0,1fr)_auto] sm:gap-2.5 sm:items-end";

// Visible labels for mobile layout (header is hidden on small screens).
const LINE_LABELS = ["Product", "Qty", "Mfg Date", "Expiry Date"] as const;

const cellLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "var(--text-muted)",
};

// ─── Component ────────────────────────────────────────────────────────────────

function PurchaseOrderModal({ data }: { data: ModalRecord }) {
  const { close } = useModal();
  const { toast } = useToast();

  const { suppliers, loading: suppliersLoading } = useSuppliers();
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState<POLine[]>([
    { productId: 0, qty: 1, manufactureDate: "", expiryDate: "" },
  ]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    listProducts({ pageSize: 300 }).then((r) => setProducts(r.data ?? [])).catch(() => {});
  }, []);

  const addLine = useCallback(() => {
    setLines((prev) => [...prev, { productId: 0, qty: 1, manufactureDate: "", expiryDate: "" }]);
  }, []);

  const removeLine = useCallback((idx: number) => {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const updateLine = useCallback(
    (idx: number, field: keyof POLine, value: string | number) => {
      setLines((prev) =>
        prev.map((line, i) =>
          i === idx
            ? {
                ...line,
                [field]:
                  field === "productId" || field === "qty"
                    ? Number(value)
                    : value,
              }
            : line,
        ),
      );
    },
    [],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!supplierId) {
      setError("Supplier is required");
      return;
    }
    const validLines = lines.filter((l) => l.productId > 0 && l.qty > 0);
    if (validLines.length === 0) {
      setError("At least one product line is required");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const body: PurchaseCreateRequest = {
        supplierId: Number(supplierId),
        lines: validLines.map((l) => ({ productId: l.productId, qty: l.qty, unitCost: 0 })),
        description: description.trim() || null,
      };
      await createPurchaseOrder(body);
      toast("Purchase order created", "ok");
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
      toast(err instanceof Error ? err.message : "Create failed", "err");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Subtitle completing the shell header */}
      <p className="modal-sub" style={{ marginTop: -8, marginBottom: 16 }}>
        Add a new purchase order from a supplier
      </p>

      {/* Supplier */}
      <div className="field">
        <label>
          Supplier <span style={{ color: "var(--danger)" }}>*</span>
        </label>
        <select
          required
          value={supplierId}
          onChange={(e) => setSupplierId(e.target.value)}
        >
          <option value="">Select a supplier…</option>
          {suppliersLoading ? (
            <option disabled>Loading…</option>
          ) : (
            suppliers.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {esc(s.name)} (ID: {s.id})
              </option>
            ))
          )}
        </select>
      </div>

      {/* Description */}
      <div className="field">
        <label>Description</label>
        <textarea
          rows={2}
          placeholder="Optional notes…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* Line Items */}
      <div
        className="rounded-xl"
        style={{
          border: "1px solid var(--border-subtle)",
          background: "var(--surface-alt)",
          padding: 12,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--text-dim)",
            marginBottom: 10,
          }}
        >
          Line Items
        </div>

        {/* Column labels — desktop only */}
        <div
          className={`hidden sm:grid ${LINE_ROWS}`}
          style={{ marginBottom: 6 }}
          aria-hidden
        >
          <div style={cellLabelStyle}>Product</div>
          <div style={cellLabelStyle}>Qty</div>
          <div style={cellLabelStyle}>Mfg Date</div>
          <div style={cellLabelStyle}>Expiry Date</div>
          <div style={cellLabelStyle}>Remove</div>
        </div>

        <div className="space-y-2">
          {lines.map((line, idx) => (
            <div key={idx} className={LINE_ROWS} style={{ position: "relative" }}>
              {/* Remove button — absolute top-right on mobile, static grid cell on desktop */}
              {lines.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removeLine(idx)}
                  title="Remove line"
                  aria-label={`Remove line ${idx + 1}`}
                  className="absolute top-0 right-0 z-10 h-7 w-7 sm:static sm:justify-self-end items-center rounded-lg transition-colors hover:bg-red-500/10 hover:text-red-500"
                  style={{ color: "var(--text-muted)" }}
                >
                  <X size={15} strokeWidth={2.5} />
                </button>
              ) : (
                <span className="h-7 w-7 sm:hidden" aria-hidden />
              )}

              {/* Product */}
              <div className="min-w-0">
                <label className="sm:hidden text-xs font-medium text-[var(--text-muted)] mb-1 block">
                  {LINE_LABELS[0]}
                </label>
                <select
                  aria-label="Product"
                  value={String(line.productId)}
                  onChange={(e) => updateLine(idx, "productId", e.target.value)}
                  className="w-full min-w-0"
                >
                  <option value="0" disabled>Select product…</option>
                  {products.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {esc(p.name)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Qty */}
              <div className="min-w-0">
                <label className="sm:hidden text-xs font-medium text-[var(--text-muted)] mb-1 block">
                  {LINE_LABELS[1]}
                </label>
                <input
                  type="number"
                  aria-label="Quantity"
                  min="1"
                  value={line.qty}
                  onChange={(e) => updateLine(idx, "qty", e.target.value)}
                  className="w-full min-w-0"
                  style={{ textAlign: "center" }}
                />
              </div>

              {/* Manufacture Date */}
              <div className="min-w-0 sm:col-span-1">
                <label className="sm:hidden text-xs font-medium text-[var(--text-muted)] mb-1 block">
                  {LINE_LABELS[2]}
                </label>
                <input
                  type="date"
                  aria-label="Manufacture date"
                  value={line.manufactureDate}
                  onChange={(e) => updateLine(idx, "manufactureDate", e.target.value)}
                  className="w-full min-w-0"
                />
              </div>

              {/* Expiry Date */}
              <div className="min-w-0 sm:col-span-1">
                <label className="sm:hidden text-xs font-medium text-[var(--text-muted)] mb-1 block">
                  {LINE_LABELS[3]}
                </label>
                <input
                  type="date"
                  aria-label="Expiry date"
                  value={line.expiryDate}
                  onChange={(e) => updateLine(idx, "expiryDate", e.target.value)}
                  className="w-full min-w-0"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Add Line */}
        <button
          type="button"
          onClick={addLine}
          className="mt-3 inline-flex items-center gap-1 text-xs font-bold transition-opacity hover:opacity-80"
          style={{ color: "var(--accent)" }}
        >
          <Plus size={14} strokeWidth={3} /> Add Line
        </button>
      </div>

      {error && <p className="login-error">{error}</p>}

      {/* Footer */}
      <div className="modal-footer" style={{ margin: "16px -24px -24px" }}>
        <button type="button" className="btn btn-ghost" onClick={close} disabled={busy}>
          Cancel
        </button>
        <button type="submit" className="btn solid" disabled={busy}>
          {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {busy ? "Saving…" : "Create PO"}
        </button>
      </div>
    </form>
  );
}

// ─── Registration ─────────────────────────────────────────────────────────────

let registered = false;
if (typeof window !== "undefined" && !registered) {
  registered = true;
  registerModalSlot("purchase-order", (data: ModalRecord) => (
    <PurchaseOrderModal data={data} />
  ));
}

export { PurchaseOrderModal };
export default PurchaseOrderModal;
