"use client";

import { useEffect, useState } from "react";
import { listSuppliers, createSupplier, deleteSupplier } from "@/lib/api/suppliers";
import type { SupplierDto, SupplierRequest } from "@/lib/types";
import { esc } from "@/components/ui";
import { useToast } from "@/components/toast";
import { useOrderEvents, useFinancialEvents } from "@/lib/notifications";
import { ViewButton } from "@/components/ui/Modal";
import "@/components/modals/SupplierModal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";

export default function SuppliersPage() {
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    listSuppliers()
      .then((r) => setSuppliers(r.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [refreshTick]);

  // Live updates: supplier balances change when PO payments are recorded.
  useFinancialEvents({ onTransactionCreated: () => setRefreshTick((t) => t + 1) });
  useOrderEvents({ onPoStatusChanged: () => setRefreshTick((t) => t + 1) });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Name is required"); return; }
    setBusy(true);
    setError("");
    try {
      const result = await createSupplier({
        name: name.trim() || null,
        contactPerson: contactPerson.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        photoPath: null,
        photo: null,
        description: null,
      } as SupplierRequest);
      toast("Supplier created", "ok");
      setShowCreate(false);
      setName(""); setContactPerson(""); setPhone(""); setAddress("");
      if (result.success && result.data) setSuppliers((prev) => [result.data!, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
      toast(err instanceof Error ? err.message : "Create failed", "err");
    } finally { setBusy(false); }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this supplier?")) return;
    try {
      await deleteSupplier(id);
      toast("Supplier deleted", "ok");
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      toast(err instanceof Error ? err.message : "Delete failed", "err");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Suppliers</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage your supplier directory.</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={15} />
          New Supplier
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : suppliers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-sm text-slate-400 dark:text-slate-500 gap-2">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-30"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>
              <span>No suppliers found</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium text-sm">{esc(s.name)}</TableCell>
                    <TableCell className="text-sm text-slate-600 dark:text-slate-400">{esc(s.contactPerson ?? "")}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">{esc(s.phone ?? "")}</TableCell>
                    <TableCell className="text-sm text-slate-500 max-w-48 truncate">{esc(s.address ?? "")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <ViewButton data={{ id: s.id }} keyType="supplier" />
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(s.id)}>Delete</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={showCreate}
        onOpenChange={setShowCreate}
        title="Create Supplier"
        description="Add a new supplier."
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCreate(false)} disabled={busy}>Cancel</Button>
            <Button onClick={(e) => (document.getElementById("create-supplier-form") as HTMLFormElement)?.requestSubmit()} disabled={busy}>{busy ? "Creating…" : "Create"}</Button>
          </>
        }
      >
        <form id="create-supplier-form" onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Name <span className="text-red-500">*</span></label>
            <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Supplier name…" autoFocus />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Contact Person</label>
              <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Phone</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Address</label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </form>
      </Dialog>
    </div>
  );
}
