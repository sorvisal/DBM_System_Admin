"use client";

import { useEffect, useState } from "react";
import { listCustomers, createCustomer, deleteCustomer } from "@/lib/api/customers";
import type { CustomerDto, CustomerRequest } from "@/lib/types";
import { esc, fmtDate } from "@/components/ui";
import { useToast } from "@/components/toast";
import { useOrderEvents, useFinancialEvents } from "@/lib/notifications";
import { uploadsUrl } from "@/lib/api";
import { ViewButton } from "@/components/ui/Modal";
import "@/components/modals/CustomerModal";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search } from "lucide-react";

export default function CustomersPage() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<CustomerDto[]>([]);
  const [meta, setMeta] = useState<{ page: number; pageSize: number; total: number; totalPages: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState("active");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const json = await listCustomers({ page, pageSize: 20, search: search || undefined });
        setCustomers(json.data ?? []);
        setMeta(json.meta ?? null);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [page, search, refreshTick]);

  // Live updates: balances/stats change when orders complete or payments are recorded.
  useOrderEvents({ onOrderStatusChanged: () => setRefreshTick((t) => t + 1) });
  useFinancialEvents({ onTransactionCreated: () => setRefreshTick((t) => t + 1) });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Name is required"); return; }
    setBusy(true);
    setError("");
    try {
      const result = await createCustomer({ name: name.trim(), phone: phone.trim() || null, address: address.trim() || null, status, description: null } as CustomerRequest);
      toast("Customer created", "ok");
      setShowCreate(false);
      setName(""); setPhone(""); setAddress(""); setStatus("active");
      if (result.success && result.data) setCustomers((prev) => [result.data!, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
      toast(err instanceof Error ? err.message : "Create failed", "err");
    } finally { setBusy(false); }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this customer?")) return;
    try {
      await deleteCustomer(id);
      toast("Customer deleted", "ok");
      setCustomers((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      toast(err instanceof Error ? err.message : "Delete failed", "err");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Customers</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage your customer directory.</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={15} />
          New Customer
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Search size={14} />
            Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <Input
              placeholder="Search customers…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-sm text-slate-400 dark:text-slate-500 gap-2">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-30"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
              <span>No customers found</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {c.photoPath ? (
                          <img src={uploadsUrl(c.photoPath)} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-medium text-slate-500 flex-shrink-0">
                            {(c.name ?? "").slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium text-sm">{esc(c.name)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{esc(c.phone ?? "")}</div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-40">{esc(c.address ?? "")}</div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold">${c.balance.toFixed(2)}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.status === "active" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : c.status === "blocked" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}>
                        {c.status}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">{fmtDate(c.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <ViewButton data={{ id: c.id }} keyType="customer" />
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(c.id)}>Delete</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 text-sm text-slate-500">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800">Prev</button>
            <span>Page {page} of {meta.totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))} disabled={page >= meta.totalPages} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800">Next</button>
          </div>
        )}
      </Card>

      <Dialog
        open={showCreate}
        onOpenChange={setShowCreate}
        title="Create Customer"
        description="Add a new customer."
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCreate(false)} disabled={busy}>Cancel</Button>
            <Button onClick={(e) => (document.getElementById("create-customer-form") as HTMLFormElement)?.requestSubmit()} disabled={busy}>{busy ? "Creating…" : "Create"}</Button>
          </>
        }
      >
        <form id="create-customer-form" onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Name <span className="text-red-500">*</span></label>
            <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Customer name…" autoFocus />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Phone</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Contact number…" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Status</label>
              <Select value={status} onChange={setStatus}>
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Address</label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Delivery address…" />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </form>
      </Dialog>
    </div>
  );
}
