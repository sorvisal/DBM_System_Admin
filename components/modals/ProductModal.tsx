"use client";

import { useState, useEffect } from "react";
import { getProduct } from "@/lib/api/products";
import { listStockMovements } from "@/lib/api/stockMovements";
import { listPurchaseOrders } from "@/lib/api/purchaseOrders";
import { listOrders } from "@/lib/api/orders";
import type { ProductDto, StockMovementDto, PurchaseOrderDto, OrderDto } from "@/lib/types";
import { PurchaseOrderStatus } from "@/lib/types";
import type { ModalRecord } from "@/components/ui/Modal";
import { useModal } from "@/components/ui/Modal";
import { Badge, esc, fmtDate, fmtDateTime } from "@/components/ui";
import { uploadsUrl } from "@/lib/api";
import { registerModalSlot } from "@/components/ui/Modal";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

function ProductModal({ data }: { data: ModalRecord }) {
  const { close } = useModal();
  const productId = typeof data.productId === "number" ? data.productId : typeof data.id === "number" ? data.id : 0;
  const [product, setProduct] = useState<ProductDto | null>(null);
  const [movements, setMovements] = useState<StockMovementDto[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderDto[]>([]);
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!productId) return;
    async function load() {
      try {
        const [prodRes, movRes, poRes, ordRes] = await Promise.all([
          getProduct(productId),
          listStockMovements({ productId, pageSize: 30 }),
          listPurchaseOrders({ pageSize: 100 }),
          listOrders({ pageSize: 100 }),
        ]);
        setProduct(prodRes.data ?? null);
        setMovements(movRes.data ?? []);
        setPurchaseOrders((poRes.data ?? []).filter((po) => (po.lines ?? []).some((l) => l.productId === productId)));
        setOrders((ordRes.data ?? []).filter((o) => (o.lines ?? []).some((l) => l.productId === productId)));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Load failed");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [productId]);

  return (
    <Dialog open={!!product || loading} onOpenChange={(v) => { if (!v) close(); }} wide>
      {loading && (
        <div className="space-y-4 p-5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-32 w-full" />
        </div>
      )}
      {error && <p className="p-4 text-sm text-red-500">{error}</p>}
      {product && !loading && (
        <>
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] mb-1">Product</p>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">{esc(product.name)}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              SKU: <span className="font-mono">{esc(product.sku)}</span>
              {product.categoryName ? ` · ${esc(product.categoryName)}` : ""}
            </p>
          </div>

          <div className="px-5 py-4 space-y-5 max-h-[60vh] overflow-y-auto">
            <div className="flex items-start gap-4">
              {product.photoPath && (
                <img src={uploadsUrl(product.photoPath)} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border border-slate-200 dark:border-slate-800" />
              )}
              <div className="flex-1 text-sm space-y-1">
                <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                  <div><span className="text-slate-500 dark:text-slate-400">Price:</span> <span className="font-semibold ml-1">${product.price.toFixed(2)}</span></div>
                  <div><span className="text-slate-500 dark:text-slate-400">Cost:</span> <span className="ml-1">${product.costPrice.toFixed(2)}</span></div>
                  <div><span className="text-slate-500 dark:text-slate-400">Stock:</span> <span className="font-mono font-semibold ml-1">{product.stockQty}</span> <span className="text-slate-400 dark:text-slate-500 text-xs">(threshold: {product.lowStockThreshold})</span></div>
                  <div><span className="text-slate-500 dark:text-slate-400">Status:</span> <Badge variant={product.isActive ? "ok" : "muted"}>{product.isActive ? "Active" : "Inactive"}</Badge></div>
                  {product.expiryDate && <div><span className="text-slate-500 dark:text-slate-400">Expiry:</span> <span className="ml-1 font-mono text-xs">{fmtDate(product.expiryDate)}</span></div>}
                  {product.manufactureDate && <div><span className="text-slate-500 dark:text-slate-400">Mfg:</span> <span className="ml-1 font-mono text-xs">{fmtDate(product.manufactureDate)}</span></div>}
                </div>
                {product.description && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{esc(product.description)}</p>}
              </div>
            </div>

            {movements.length > 0 && (
              <div>
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Recent Movements</div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead>Note</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movements.slice(0, 8).map((m) => (
                        <TableRow key={m.id}>
                          <TableCell className="font-mono text-xs text-slate-500">{fmtDateTime(m.createdAt)}</TableCell>
                          <TableCell><Badge variant={m.type === "in" ? "ok" : "warn"}>{m.type}</Badge></TableCell>
                          <TableCell className={`text-right font-mono text-xs font-semibold ${m.type === "in" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                            {m.type === "in" ? "+" : "-"}{m.quantity}
                          </TableCell>
                          <TableCell className="text-xs text-slate-400">{esc(m.note ?? "")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {purchaseOrders.length > 0 && (
              <div>
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Purchase Orders</div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>PO#</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchaseOrders.slice(0, 5).map((po) => (
                        <TableRow key={po.id}>
                          <TableCell className="font-mono text-xs">{esc(po.code)}</TableCell>
                          <TableCell className="font-medium text-sm">{esc(po.supplierName)}</TableCell>
                          <TableCell className="text-right font-mono text-xs">${po.totalAmount.toFixed(2)}</TableCell>
                          <TableCell><Badge variant={po.status === PurchaseOrderStatus.Completed ? "ok" : "muted"}>{po.status}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {orders.length > 0 && (
              <div>
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Orders ({orders.length})</div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.slice(0, 5).map((o) => {
                        const line = (o.lines ?? []).find((l) => l.productId === productId);
                        return (
                          <TableRow key={o.id}>
                            <TableCell className="font-mono text-xs">{esc(o.code)}</TableCell>
                            <TableCell className="text-sm">{esc(o.customerName ?? "—")}</TableCell>
                            <TableCell className="text-right font-mono text-xs">{line?.qty ?? 0}</TableCell>
                            <TableCell className="text-right font-mono text-xs">${(line?.lineTotal ?? 0).toFixed(2)}</TableCell>
                            <TableCell><Badge variant="muted">{o.status}</Badge></TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
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
  registerModalSlot("product", (data: ModalRecord) => <ProductModal data={data} />);
}

export { ProductModal };
export default ProductModal;
