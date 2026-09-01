"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getProduct } from "@/lib/api/products";
import { listStockMovements } from "@/lib/api/stockMovements";
import { listPurchaseOrders } from "@/lib/api/purchaseOrders";
import { listOrders } from "@/lib/api/orders";
import type { ProductDto, StockMovementDto, OrderDto } from "@/lib/types";
import { PurchaseOrderStatus, OrderStatus } from "@/lib/types";
import type { PurchaseOrderDto } from "@/lib/types";
import { Badge, esc, fmtDate, fmtDateTime } from "@/components/ui";
import { uploadsUrl } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/ui/avatar";
import { ArrowLeft, Package } from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = parseInt(params.id as string, 10);
  const [product, setProduct] = useState<ProductDto | null>(null);
  const [movements, setMovements] = useState<StockMovementDto[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderDto[]>([]);
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isNaN(productId)) return;
    async function load() {
      try {
        const [prodRes, movRes, poRes, ordRes] = await Promise.all([
          getProduct(productId),
          listStockMovements({ productId, pageSize: 50 }),
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

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-7 w-48" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    );
  }
  if (error) return <div className="text-sm text-red-500 p-4">{error}</div>;
  if (!product) return <div className="flex flex-col items-center py-12 text-sm text-slate-400 dark:text-slate-500 gap-2"><Package size={32} className="opacity-30" /><span>Product not found</span></div>;

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-3 gap-2">
          <ArrowLeft size={14} /> Back
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">{esc(product.name)}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">SKU: <span className="font-mono">{esc(product.sku)}</span></p>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.push(`/admin/products`)}>Edit</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Product info */}
        <Card>
          <CardHeader>
            <CardTitle>Product Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-start">
              {product.photoPath ? (
                <img src={uploadsUrl(product.photoPath)} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <Avatar fallback={product.name.slice(0, 2).toUpperCase()} className="w-16 h-16 text-lg flex-shrink-0" />
              )}
              <div className="flex-1 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Category</span><span className="font-medium">{esc(product.categoryName)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Price</span><span className="font-mono font-semibold">${product.price.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Cost</span><span className="font-mono">${product.costPrice.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Stock</span><span className={`font-mono font-semibold ${product.stockQty <= product.lowStockThreshold ? "text-red-500" : ""}`}>{product.stockQty} <span className="text-slate-400 text-xs dark:text-slate-500">(threshold: {product.lowStockThreshold})</span></span></div>
                {product.expiryDate && <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Expiry</span><span className="font-mono text-xs">{fmtDate(product.expiryDate)}</span></div>}
                {product.manufactureDate && <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Mfg</span><span className="font-mono text-xs">{fmtDate(product.manufactureDate)}</span></div>}
                <div className="pt-1"><Badge variant={product.isActive ? "ok" : "default"}>{product.isActive ? "Active" : "Inactive"}</Badge></div>
              </div>
            </div>
            {product.description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">{esc(product.description)}</p>}
          </CardContent>
        </Card>

        {/* Stock movements */}
        <Card>
          <CardHeader>
            <CardTitle>Stock Movements</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {movements.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-sm text-slate-400 dark:text-slate-500 gap-2"><span>No movements</span></div>
            ) : (
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
                  {movements.slice(0, 10).map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-mono text-xs text-slate-500 dark:text-slate-400">{fmtDateTime(m.createdAt)}</TableCell>
                      <TableCell><Badge variant={m.type === "in" ? "ok" : "warn"}>{m.type}</Badge></TableCell>
                      <TableCell className={`text-right font-mono text-xs font-semibold ${m.type === "in" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>{m.type === "in" ? "+" : "-"}{m.quantity}</TableCell>
                      <TableCell className="text-xs text-slate-400">{esc(m.note ?? "")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Purchase orders */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Orders ({purchaseOrders.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {purchaseOrders.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-sm text-slate-400 dark:text-slate-500 gap-2"><span>No purchase orders</span></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO#</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrders.map((po) => (
                  <TableRow key={po.id}>
                    <TableCell className="font-mono text-xs">{esc(po.code)}</TableCell>
                    <TableCell className="font-medium text-sm">{esc(po.supplierName)}</TableCell>
                    <TableCell className="text-right font-mono text-xs">${po.totalAmount.toFixed(2)}</TableCell>
                    <TableCell><Badge variant={po.status === PurchaseOrderStatus.Completed ? "ok" : "default"}>{po.status}</Badge></TableCell>
                    <TableCell className="font-mono text-xs text-slate-500 dark:text-slate-400">{fmtDate(po.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Orders ({orders.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {orders.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-sm text-slate-400 dark:text-slate-500 gap-2"><span>No orders</span></div>
          ) : (
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
                {orders.map((o) => {
                  const line = (o.lines ?? []).find((l) => l.productId === productId);
                  return (
                    <TableRow key={o.id}>
                      <TableCell><a href={`/admin/orders/${o.id}`} className="font-mono text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">{esc(o.code)}</a></TableCell>
                      <TableCell className="text-sm">{esc(o.customerName)}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{line?.qty ?? 0}</TableCell>
                      <TableCell className="text-right font-mono text-xs">${(line?.lineTotal ?? 0).toFixed(2)}</TableCell>
                      <TableCell><Badge variant={o.status === OrderStatus.Completed ? "ok" : "default"}>{o.status}</Badge></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
