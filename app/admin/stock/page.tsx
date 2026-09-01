"use client";

import { useEffect, useState, useCallback } from "react";
import { listStockMovements, adjustStock, deleteStockMovement } from "@/lib/api/stockMovements";
import { listProducts } from "@/lib/api/products";
import type { StockMovementDto, ProductDto, ApiMeta } from "@/lib/types";
import { Badge, esc, fmtDateTime } from "@/components/ui";
import { useToast } from "@/components/toast";
import { useProductEvents } from "@/lib/notifications";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Filter } from "lucide-react";

function typeBadgeVariant(t: string): "ok" | "warn" | "default" {
  switch (t) {
    case "in": return "ok";
    case "out": return "warn";
    default: return "default";
  }
}

function typeLabel(t: string): string {
  switch (t) {
    case "in": return "IN";
    case "out": return "OUT";
    default: return "ADJUST";
  }
}

export default function StockPage() {
  const { toast } = useToast();
  const [movements, setMovements] = useState<StockMovementDto[]>([]);
  const [meta, setMeta] = useState<ApiMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [filterProductId, setFilterProductId] = useState("");
  const [filterType, setFilterType] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjProduct, setAdjProduct] = useState("");
  const [adjType, setAdjType] = useState("in");
  const [adjQty, setAdjQty] = useState("");
  const [adjNote, setAdjNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    listProducts({ pageSize: 200 }).then((r) => setProducts(r.data ?? [])).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const json = await listStockMovements({
        page, pageSize: 20,
        productId: filterProductId || undefined,
        type: filterType || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
      });
      setMovements(json.data ?? []);
      setMeta(json.meta ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [page, filterProductId, filterType, fromDate, toDate]);

  useEffect(() => { load(); }, [load]);

  useProductEvents({
    onStockAdjusted() { load(); },
  });

  async function handleAdjust(e: React.FormEvent) {
    e.preventDefault();
    const pid = parseInt(adjProduct, 10);
    const qty = parseInt(adjQty, 10);
    if (!pid || !qty || qty <= 0) { toast("Invalid product or quantity", "err"); return; }
    setBusy(true);
    try {
      await adjustStock({ productId: pid, type: adjType, quantity: qty, note: adjNote.trim() || null } as import("@/lib/types/stockMovement").StockAdjustRequest);
      toast("Stock adjusted", "ok");
      setShowAdjust(false);
      setAdjProduct(""); setAdjQty(""); setAdjNote("");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "err");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this stock movement?")) return;
    try {
      await deleteStockMovement(id);
      toast("Movement deleted", "ok");
      setMovements((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      toast(err instanceof Error ? err.message : "Delete failed", "err");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Stock Movements</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Track all stock adjustments, receipts, and deductions.</p>
        </div>
        <Button onClick={() => setShowAdjust(true)}>
          <Plus size={15} />
          Adjust Stock
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Filter size={14} />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Select value={filterProductId} onChange={(v) => { setFilterProductId(v); setPage(1); }} className="w-48">
              <option value="">All products</option>
              {products.map((p) => <option key={p.id} value={String(p.id)}>{esc(p.name)}</option>)}
            </Select>
            <Select value={filterType} onChange={(v) => { setFilterType(v); setPage(1); }} className="w-32">
              <option value="">All types</option>
              <option value="in">IN</option>
              <option value="out">OUT</option>
              <option value="adjustment">ADJUST</option>
            </Select>
            <Input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }} className="w-40" />
            <Input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }} className="w-40" />
            {(filterProductId || filterType || fromDate || toDate) && (
              <Button variant="ghost" size="sm" onClick={() => { setFilterProductId(""); setFilterType(""); setFromDate(""); setToDate(""); setPage(1); }}>
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-sm text-red-500">{error}</div>
          ) : movements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-sm text-slate-400 dark:text-slate-500 gap-2">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-30"><path d="M20 13V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7m16 0H4" /></svg>
              <span>No stock movements.</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono text-xs text-slate-500">{fmtDateTime(m.createdAt)}</TableCell>
                    <TableCell className="font-medium text-sm">{esc(m.productName)}</TableCell>
                    <TableCell><Badge variant={typeBadgeVariant(m.type ?? "in")}>{typeLabel(m.type ?? "")}</Badge></TableCell>
                    <TableCell className={`text-right font-mono text-xs font-semibold ${m.type === "in" ? "text-emerald-600 dark:text-emerald-400" : m.type === "out" ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}`}>
                      {m.type === "in" ? "+" : m.type === "out" ? "-" : ""}{m.quantity}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">
                      {m.referenceType === "purchase" ? "PO#" + m.referenceId : m.referenceType === "order" ? "Order#" + m.referenceId : "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">{m.userId ? "#" + m.userId : "—"}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">—</TableCell>
                    <TableCell className="max-w-32 truncate text-xs text-slate-400">{esc(m.note ?? "")}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950" onClick={() => handleDelete(m.id)}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        {meta && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 text-sm text-slate-500">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800">
              ‹ Prev
            </button>
            <span>Page {page} of {meta.totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))} disabled={page >= meta.totalPages} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800">
              Next ›
            </button>
          </div>
        )}
      </Card>

      <Dialog
        open={showAdjust}
        onOpenChange={setShowAdjust}
        title="Adjust Stock"
        description="Manually adjust the stock quantity for a product."
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowAdjust(false)} disabled={busy}>Cancel</Button>
            <Button onClick={(e) => (document.getElementById("adjust-form") as HTMLFormElement)?.requestSubmit()} disabled={busy}>
              {busy ? "Adjusting…" : "Adjust"}
            </Button>
          </>
        }
      >
        <form id="adjust-form" onSubmit={handleAdjust} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Product</label>
            <select required value={adjProduct} onChange={(e) => setAdjProduct(e.target.value)} className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm">
              <option value="">Select product</option>
              {products.map((p) => <option key={p.id} value={String(p.id)}>{esc(p.name)} (stock: {p.stockQty})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Type</label>
              <select value={adjType} onChange={(e) => setAdjType(e.target.value)} className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm">
                <option value="in">IN (add)</option>
                <option value="out">OUT (remove)</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Quantity</label>
              <Input type="number" min="1" required value={adjQty} onChange={(e) => setAdjQty(e.target.value)} placeholder="1" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Note</label>
            <Input value={adjNote} onChange={(e) => setAdjNote(e.target.value)} placeholder="Optional note" />
          </div>
        </form>
      </Dialog>
    </div>
  );
}
