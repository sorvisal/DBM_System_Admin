"use client";

import { useEffect, useState } from "react";
import { useRequireSuperAdmin } from "@/lib/platform";
import { listSuperDepots, toggleSuperDepot, deleteSuperDepot } from "@/lib/api/superadmin";
import type { DepotSummaryDto } from "@/lib/types";
import { esc, fmtDate } from "@/components/ui";
import { useToast } from "@/components/toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Search, Filter, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SuperAdminDepotsPage() {
  const isSuperAdmin = useRequireSuperAdmin();
  const { toast } = useToast();

  const [rows, setRows] = useState<DepotSummaryDto[]>([]);
  const [meta, setMeta] = useState<{ page: number; pageSize: number; total: number; totalPages: number } | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showDelete, setShowDelete] = useState<DepotSummaryDto | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const json = await listSuperDepots({
        page, pageSize: 20,
        search: search || undefined,
        isActive: active || undefined,
      });
      setRows(json.data ?? []);
      setMeta(json.meta ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [page, search, active]);

  if (!isSuperAdmin) return null;

  const pages = meta?.totalPages ?? 1;

  async function toggleDepot(d: DepotSummaryDto) {
    try {
      await toggleSuperDepot(d.id);
      toast(`${d.name} ${d.isActive ? "disabled" : "enabled"}`, "ok");
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Update failed", "err");
    }
  }

  async function deleteDepotHandler() {
    if (!showDelete) return;
    setDeleteBusy(true);
    try {
      await deleteSuperDepot(showDelete.id);
      toast(`Deleted ${showDelete.name}`, "ok");
      setShowDelete(null);
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Delete failed", "err");
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Depot Management</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">View and manage all depots across the platform.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm"><Filter size={14} />Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <Input placeholder="Search depot name or code…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
            </div>
            <Select value={active} onChange={(v) => { setActive(v); setPage(1); }} className="w-32">
              <option value="">All status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>
            {(search || active) && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setActive(""); setPage(1); }}>Clear</Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : error ? (
            <div className="p-4 text-sm text-red-500">{error}</div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-sm text-slate-400 gap-2">
              <MapPin size={32} className="opacity-30" />
              <span>No depots found</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Default</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium text-sm">{esc(d.name)}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">{esc(d.code)}</TableCell>
                    <TableCell className="text-sm">{esc(d.organizationName)}</TableCell>
                    <TableCell>
                      <Badge variant={d.isActive ? "ok" : "default"}>{d.isActive ? "Active" : "Inactive"}</Badge>
                    </TableCell>
                    <TableCell>{d.isDefault ? "Yes" : "—"}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-400">{fmtDate(d.updatedAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className={d.isActive ? "text-red-500" : "text-emerald-500"} onClick={() => toggleDepot(d)}>
                          {d.isActive ? "Disable" : "Enable"}
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => setShowDelete(d)}>Delete</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 text-sm text-slate-500">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800">Prev</button>
            <span>Page {page} of {pages}</span>
            <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page >= pages} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800">Next</button>
          </div>
        )}
      </Card>

      {/* Delete confirm */}
      <Dialog
        open={!!showDelete} onOpenChange={(v) => { if (!v) setShowDelete(null); }}
        title="Delete Depot" description={showDelete ? `Permanently delete ${showDelete.name}?` : ""}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowDelete(null)} disabled={deleteBusy}>Cancel</Button>
            <Button variant="destructive" onClick={deleteDepotHandler} disabled={deleteBusy}>{deleteBusy ? "Deleting…" : "Delete"}</Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-400">This action cannot be undone. The depot and all associated data will be permanently removed.</p>
      </Dialog>
    </div>
  );
}
