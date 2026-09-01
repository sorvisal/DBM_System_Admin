"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSupplier } from "@/lib/api/suppliers";
import { listPurchaseOrders } from "@/lib/api/purchaseOrders";
import type { SupplierDto, PurchaseOrderDto } from "@/lib/types";
import { PurchaseOrderStatus } from "@/lib/types";
import { esc, fmtDate } from "@/components/ui";
import { uploadsUrl } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Building2 } from "lucide-react";

export default function SupplierDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supplierId = parseInt(params.id as string, 10);
  const [supplier, setSupplier] = useState<SupplierDto | null>(null);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isNaN(supplierId)) return;
    Promise.all([
      getSupplier(supplierId),
      listPurchaseOrders({ pageSize: 100 }),
    ]).then(([supRes, poRes]) => {
      setSupplier(supRes.data ?? null);
      setPurchaseOrders((poRes.data ?? []).filter((po) => po.supplierId === supplierId));
    }).catch((err) => setError(err instanceof Error ? err.message : "Load failed")).finally(() => setLoading(false));
  }, [supplierId]);

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
  if (!supplier) return <div className="flex flex-col items-center py-12 text-sm text-slate-400 dark:text-slate-500 gap-2"><Building2 size={32} className="opacity-30" /><span>Supplier not found</span></div>;

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-3 gap-2">
          <ArrowLeft size={14} /> Back
        </Button>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">{esc(supplier.name)}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Info */}
        <Card>
          <CardHeader>
            <CardTitle>Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-start">
              {supplier.photoPath ? (
                <img src={uploadsUrl(supplier.photoPath)} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <Avatar fallback={(supplier.name ?? "").slice(0, 2).toUpperCase()} className="w-14 h-14 text-base flex-shrink-0" />
              )}
              <div className="flex-1 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Contact</span><span>{esc(supplier.contactPerson ?? "—")}</span></div>
                <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Phone</span><span className="font-mono text-xs">{esc(supplier.phone ?? "—")}</span></div>
                <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Address</span><span className="text-xs text-right max-w-48 truncate">{esc(supplier.address ?? "—")}</span></div>
                {supplier.description && <p className="text-sm text-slate-500 dark:text-slate-400 pt-1">{esc(supplier.description)}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Purchase Orders */}
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
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseOrders.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell className="font-mono text-xs">{esc(po.code)}</TableCell>
                      <TableCell className="text-right font-mono text-xs">${po.totalAmount.toFixed(2)}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          po.status === PurchaseOrderStatus.Completed ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                          po.status === PurchaseOrderStatus.Cancelled ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                          "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}>{po.status}</span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-500 dark:text-slate-400">{fmtDate(po.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
