"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/toast";
import { esc, fmtDateTime, fmtMoney } from "@/components/ui";
import { listProducts } from "@/lib/api/products";
import { listCustomers } from "@/lib/api/customers";
import { listStockMovements } from "@/lib/api/stockMovements";
import { createOrder } from "@/lib/api/orders";
import type { CustomerDto, OrderDto, ProductDto, StockMovementDto } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";

type ProductOption = ProductDto & { search: string };

export default function StockOutPage() {
  const { toast } = useToast();

  const [customerId, setCustomerId] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<ProductOption | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [lastOrder, setLastOrder] = useState<OrderDto | null>(null);

  const [customers, setCustomers] = useState<CustomerDto[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [movements, setMovements] = useState<(StockMovementDto & { customerName?: string })[]>([]);
  const [todayOutQty, setTodayOutQty] = useState(0);
  const [todayOutRevenue, setTodayOutRevenue] = useState(0);
  const [totalItemsSold, setTotalItemsSold] = useState(0);
  const [loading, setLoading] = useState(true);
  const [movementsError, setMovementsError] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [custJson, prodJson, moveJson] = await Promise.all([
          listCustomers({ pageSize: 200 }),
          listProducts({ pageSize: 200 }),
          listStockMovements({
            type: "out",
            pageSize: 20,
            from: new Date().toISOString().split("T")[0] + "T00:00:00Z",
            to: new Date().toISOString().split("T")[0] + "T23:59:59Z",
          }),
        ]);
        setCustomers(custJson.data ?? []);
        setProducts((prodJson.data ?? []).map((p) => ({ ...p, search: `${p.name} ${p.sku}`.toLowerCase() })));

        const todayItems = moveJson.data ?? [];
        setTodayOutQty(todayItems.reduce((s, m) => s + m.quantity, 0));
        const productMap = new Map(prodJson.data?.map((p) => [p.id, p]) ?? []);
        const revenue = todayItems.reduce((s, m) => s + (productMap.get(m.productId)?.price ?? 0) * m.quantity, 0);
        setTodayOutRevenue(revenue);
        const totalJson = await listStockMovements({ type: "out", pageSize: 1 });
        setTotalItemsSold(totalJson.meta?.total ?? 0);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    async function loadMovements() {
      setMovementsError("");
      try {
        const json = await listStockMovements({ type: "out", pageSize: 15 });
        setMovements(json.data ?? []);
      } catch (err) {
        setMovementsError(err instanceof Error ? err.message : "Load failed");
      }
    }
    loadMovements();
  }, []);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter((p) => p.search.includes(q));
  }, [products, search]);

  const selectedCustomer = customers.find((c) => String(c.id) === customerId);
  const maxQty = selectedProduct?.stockQty ?? 0;
  const lineTotal = selectedProduct ? selectedProduct.price * quantity : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");
    if (!customerId) { setSubmitError("Please select a customer."); return; }
    if (!selectedProduct) { setSubmitError("Please select a product."); return; }
    if (!Number.isInteger(quantity) || quantity <= 0) { setSubmitError("Quantity must be a positive integer."); return; }
    if (quantity > maxQty) { const msg = `Cannot remove ${quantity} units — only ${maxQty} in stock for "${selectedProduct.name}".`; setSubmitError(msg); toast(msg, "err"); return; }
    setBusy(true);
    try {
      const json = await createOrder({ customerId: parseInt(customerId, 10), lines: [{ productId: selectedProduct.id, qty: quantity }], deliveryAddress: deliveryAddress.trim() || null, description: null } as import("@/lib/types/order").OrderCreateRequest);
      if (!json.success || !json.data) throw new Error(json.error ?? "Failed to create order.");
      setLastOrder(json.data);
      toast("Sale completed successfully.", "ok");
      // Reload
      const [moveJson, totalJson, todayMoveJson] = await Promise.all([
        listStockMovements({ type: "out", pageSize: 15 }),
        listStockMovements({ type: "out", pageSize: 1 }),
        listStockMovements({ type: "out", pageSize: 1, from: new Date().toISOString().split("T")[0] + "T00:00:00Z", to: new Date().toISOString().split("T")[0] + "T23:59:59Z" }),
      ]);
      setMovements(moveJson.data ?? []);
      setTotalItemsSold(totalJson.meta?.total ?? 0);
      const todayItems = todayMoveJson.data ?? [];
      setTodayOutQty(todayItems.reduce((s, m) => s + m.quantity, 0));
      setCustomerId(""); setSelectedProduct(null); setQuantity(1); setDeliveryAddress("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sale failed.";
      setSubmitError(msg);
      toast(msg, "err");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div><Skeleton className="h-7 w-32 mb-2" /><Skeleton className="h-4 w-56" /></div>
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Stock OUT</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Sell products to customers and remove inventory from stock.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Today's OUT"
          value={`${todayOutQty} items`}
          icon={<TrendingUp size={16} />}
          iconColor="text-blue-500"
        />
        <StatCard
          label="Sales Today"
          value={fmtMoney(todayOutRevenue)}
          icon={<TrendingUp size={16} />}
          iconColor="text-emerald-500"
        />
        <StatCard
          label="Total Items Sold"
          value={totalItemsSold.toLocaleString()}
          icon={<TrendingUp size={16} />}
          iconColor="text-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sale form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>New Sale</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Customer</label>
                  <select required value={customerId} onChange={(e) => { setCustomerId(e.target.value); setSubmitError(""); }} className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm">
                    <option value="">Select a customer…</option>
                    {customers.map((c) => (<option key={c.id} value={String(c.id)}>{esc(c.name)}{c.phone ? ` · ${esc(c.phone)}` : ""}</option>))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Product</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <Input
                      placeholder="Search by name or SKU…"
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); }}
                      className="pl-9"
                    />
                    {search && filteredProducts.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                        {filteredProducts.slice(0, 10).map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between"
                            onClick={() => { setSelectedProduct(p); setSubmitError(""); setQuantity(1); setSearch(""); }}
                          >
                            <span className="font-medium">{esc(p.name)}</span>
                            <span className="text-xs text-slate-400 mono ml-2">{esc(p.sku)}</span>
                            <span className="text-xs text-slate-400 dark:text-slate-500 ml-2">Stock: {p.stockQty}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedProduct && (
                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex gap-3">
                      <span>Available: <strong className="text-slate-700 dark:text-slate-300">{selectedProduct.stockQty}</strong></span>
                      <span>Price: <strong className="text-blue-600 dark:text-blue-400">{fmtMoney(selectedProduct.price)}</strong></span>
                    </div>
                  )}
                </div>

                {selectedProduct && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Quantity</label>
                      <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1} className="w-9 h-9 px-0">−</Button>
                        <Input type="number" min="1" max={maxQty} value={quantity} onChange={(e) => { setQuantity(Math.min(maxQty, Math.max(1, parseInt(e.target.value) || 1))); setSubmitError(""); }} className="text-center w-20" />
                        <Button type="button" variant="outline" size="sm" onClick={() => setQuantity(Math.min(maxQty, quantity + 1))} disabled={quantity >= maxQty} className="w-9 h-9 px-0">+</Button>
                        <span className="text-xs text-slate-400">Max: {maxQty}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Delivery Address</label>
                      <Input value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} placeholder="Optional" />
                    </div>
                  </div>
                )}

                {selectedProduct && (
                  <div className="flex justify-between items-center py-2 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Total</span>
                    <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{fmtMoney(lineTotal)}</span>
                  </div>
                )}

                {submitError && <p className="text-sm text-red-500">{esc(submitError)}</p>}

                {lastOrder && (
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 text-sm">
                    <div className="font-semibold text-emerald-700 dark:text-emerald-400 mb-1">Sale completed</div>
                    <div>Order: <span className="font-mono">{esc(lastOrder.code)}</span> · {esc(lastOrder.customerName)}</div>
                    <div>{esc(selectedProduct?.name ?? "")} × {quantity} = {fmtMoney(lineTotal)}</div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="ghost" type="button" onClick={() => { setCustomerId(""); setSelectedProduct(null); setQuantity(1); setDeliveryAddress(""); setLastOrder(null); setSubmitError(""); }}>Cancel</Button>
                  <Button type="submit" disabled={busy}>{busy ? "Processing…" : "Complete Sale"}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Order summary */}
        <Card>
          <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
          <CardContent>
            {selectedProduct ? (
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-0.5">Product</p>
                  <p className="font-medium">{esc(selectedProduct.name)}</p>
                  <p className="text-xs text-slate-400 mono">{esc(selectedProduct.sku)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-0.5">Customer</p>
                  <p className="font-medium">{selectedCustomer ? esc(selectedCustomer.name) : "—"}</p>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Subtotal</span>
                  <span className="font-mono font-semibold">{fmtMoney(lineTotal)}</span>
                </div>
              </div>
            ) : (
               <p className="text-sm text-slate-400 dark:text-slate-500">Select a product to see the summary.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent sales */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500 dark:text-slate-400">Recent Sales</span>
        <Button variant="ghost" size="sm" onClick={() => setShowHistory(true)}>View All History</Button>
      </div>

      {/* History modal */}
      <Dialog
        open={showHistory} onOpenChange={setShowHistory}
        title="Stock OUT History"
        description={`Showing ${movements.length} recent movements`}
        footer={<Button variant="ghost" onClick={() => setShowHistory(false)}>Close</Button>}
      >
        {movementsError && <p className="text-sm text-red-500 mb-3">{movementsError}</p>}
        {movements.length === 0 ? (
           <p className="text-sm text-slate-400 dark:text-slate-500">No stock OUT movements yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>User</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-mono text-xs text-slate-500 dark:text-slate-400">{fmtDateTime(m.createdAt)}</TableCell>
                  <TableCell className="font-medium text-sm">{esc(m.productName)}</TableCell>
                  <TableCell className="text-right font-mono text-xs font-semibold text-red-600 dark:text-red-400">−{m.quantity}</TableCell>
                  <TableCell className="font-mono text-xs text-slate-500 dark:text-slate-400">{m.referenceId ? "#" + m.referenceId : "—"}</TableCell>
                  <TableCell className="font-mono text-xs text-slate-500 dark:text-slate-400">{m.userId ? "#" + m.userId : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Dialog>
    </div>
  );
}
