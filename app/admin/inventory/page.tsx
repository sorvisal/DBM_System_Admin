"use client";

import { useEffect, useState, useCallback } from "react";
import { listStockMovements, getProductSummary } from "@/lib/api";
import { listProducts } from "@/lib/api/products";
import { listPurchaseOrders } from "@/lib/api/purchaseOrders";
import { listStockBatches } from "@/lib/api/stockBatches";
import type { ProductDto, StockMovementDto, PurchaseOrderDto, StockBatchDto } from "@/lib/types";
import { Badge, esc, fmtDate, fmtDateTime } from "@/components/ui";
import { useToast } from "@/components/toast";
import { useProductEvents } from "@/lib/notifications";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Package, AlertTriangle, Clock, FileText } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";

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

export default function InventoryPage() {
  const { toast } = useToast();
  const [summary, setSummary] = useState({ totalProducts: 0, lowStock: 0, expiring: 0, totalSkus: 0, lowStockCount: 0, expiringCount: 0 });
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [movements, setMovements] = useState<StockMovementDto[]>([]);
  const [pendingPOs, setPendingPOs] = useState<PurchaseOrderDto[]>([]);
  const [batches, setBatches] = useState<StockBatchDto[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, movRes, poRes, batchRes] = await Promise.all([
        listProducts({ pageSize: 50, lowStock: true }),
        listStockMovements({ page: 1, pageSize: 20 }),
        listPurchaseOrders({ pageSize: 50, status: "confirmed" }),
        listStockBatches({ page: 1, pageSize: 50 }),
      ]);
      setProducts(prodRes.data ?? []);
      setMovements(movRes.data ?? []);
      setPendingPOs(poRes.data ?? []);
      setBatches(batchRes.data ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getProductSummary()
      .then((r) => {
        if (r.success && r.data) {
          setSummary({
            totalProducts: r.data.totalSkus,
            lowStock: r.data.lowStockCount,
            expiring: r.data.expiringCount,
            totalSkus: r.data.totalSkus,
            lowStockCount: r.data.lowStockCount,
            expiringCount: r.data.expiringCount,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoadingSummary(false));

    load();
  }, [load]);

  useProductEvents({
    onProductUpdated() {
      getProductSummary().then((r) => {
        if (r.success && r.data) setSummary({ totalProducts: r.data.totalSkus, lowStock: r.data.lowStockCount, expiring: r.data.expiringCount, totalSkus: r.data.totalSkus, lowStockCount: r.data.lowStockCount, expiringCount: r.data.expiringCount });
      }).catch(() => {});
      load();
    },
    onProductDeleted() {
      getProductSummary().then((r) => {
        if (r.success && r.data) setSummary({ totalProducts: r.data.totalSkus, lowStock: r.data.lowStockCount, expiring: r.data.expiringCount, totalSkus: r.data.totalSkus, lowStockCount: r.data.lowStockCount, expiringCount: r.data.expiringCount });
      }).catch(() => {});
      load();
    },
  });

  async function handleReceive(po: PurchaseOrderDto) {
    try {
      const { receivePurchaseOrder } = await import("@/lib/api/purchaseOrders");
      await receivePurchaseOrder(po.id);
      toast("Stock received", "ok");
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Receive failed", "err");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Inventory</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Stock levels, movements, and pending receipts.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Products"
          value={loadingSummary ? "…" : String(summary.totalProducts)}
          icon={<Package size={16} />}
          iconColor="text-blue-500"
        />
        <StatCard
          label="Low Stock"
          value={loadingSummary ? "…" : String(summary.lowStock)}
          icon={<AlertTriangle size={16} />}
          iconColor="text-amber-500"
          warning={summary.lowStock > 0}
        />
        <StatCard
          label="Expiring Soon"
          value={loadingSummary ? "…" : String(summary.expiring)}
          icon={<Clock size={16} />}
          iconColor="text-orange-500"
          warning={summary.expiring > 0}
        />
        <StatCard
          label="Pending Receipts"
          value={loading ? String(pendingPOs.length) : "…"}
          icon={<FileText size={16} />}
          iconColor="text-emerald-500"
        />
      </div>

      {/* Pending POs */}
      {pendingPOs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Purchase Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingPOs.map((po) => (
                <div key={po.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <div>
                    <span className="font-medium text-sm text-slate-800 dark:text-slate-200">{esc(po.code)}</span>
                    <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">{esc(po.supplierName)}</span>
                    <div className="text-xs text-slate-400 dark:text-slate-500 mono mt-0.5">
                      {fmtDate(po.createdAt)} · {(po.lines ?? []).length} items · ${po.totalAmount.toFixed(2)}
                    </div>
                  </div>
                  <Button size="sm" onClick={() => handleReceive(po)}>Receive</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Batch overview */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Batches</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {batches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-sm text-slate-400 dark:text-slate-500 gap-2">
              <Package size={28} className="opacity-30" />
              <span>No stock batches</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Mfg</TableHead>
                  <TableHead>Exp</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium text-sm">{esc(b.productName)}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">{esc(b.batchNumber ?? "—")}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">{b.manufactureDate ? fmtDate(b.manufactureDate) : "—"}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">{b.expiryDate ? fmtDate(b.expiryDate) : "—"}</TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold">{b.quantity}</TableCell>
                    <TableCell className="text-right font-mono text-sm">${b.unitCost.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Low stock products */}
      <Card>
        <CardHeader>
          <CardTitle>Low Stock Products</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-sm text-slate-400 dark:text-slate-500 gap-2">
              <Package size={28} className="opacity-30" />
              <span>No low stock items</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Threshold</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="font-medium text-sm">{esc(p.name)}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">{esc(p.sku)}</TableCell>
                    <TableCell className="text-right font-mono text-xs font-semibold text-red-500">{p.stockQty}</TableCell>
                    <TableCell className="text-right font-mono text-xs text-slate-500">{p.lowStockThreshold}</TableCell>
                    <TableCell><Badge variant="warn">LOW STOCK</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent movements */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Stock Movements</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {movements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-sm text-slate-400 dark:text-slate-500 gap-2">
              <Package size={28} className="opacity-30" />
              <span>No recent movements</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono text-xs text-slate-500">{fmtDateTime(m.createdAt)}</TableCell>
                    <TableCell className="font-medium text-sm">{esc(m.productName)}</TableCell>
                    <TableCell><Badge variant={typeBadgeVariant(m.type ?? "in")}>{typeLabel(m.type ?? "")}</Badge></TableCell>
                    <TableCell className={`text-right font-mono text-xs font-semibold ${m.type === "in" ? "text-emerald-600 dark:text-emerald-400" : m.type === "out" ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}`}>
                      {m.type === "in" ? "+" : "-"}{m.quantity}
                    </TableCell>
                    <TableCell className="text-xs text-slate-400 dark:text-slate-500">{esc(m.note ?? "")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
