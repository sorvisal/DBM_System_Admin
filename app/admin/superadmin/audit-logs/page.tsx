"use client";

import { useEffect, useState } from "react";
import { useRequireSuperAdmin } from "@/lib/platform";
import { listAuditLogs } from "@/lib/api/superadmin";
import type { AuditLogDto } from "@/lib/types";
import { esc, fmtDate } from "@/components/ui";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Filter } from "lucide-react";

export default function AuditLogsPage() {
  const isSuperAdmin = useRequireSuperAdmin();
  const [rows, setRows] = useState<AuditLogDto[]>([]);
  const [meta, setMeta] = useState<{ page: number; pageSize: number; total: number; totalPages: number } | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [entityType, setEntityType] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const json = await listAuditLogs({
        page,
        pageSize: 20,
        entityType: entityType || undefined,
        from: fromDate ? new Date(fromDate).toISOString() : undefined,
        to: toDate ? new Date(toDate).toISOString() : undefined,
      });
      setRows(json.data ?? []);
      setMeta(json.meta ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [page, entityType, fromDate, toDate]);

  if (!isSuperAdmin) return null;

  const pages = meta?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Audit Logs</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">View system activity across all organizations and depots.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm"><Filter size={14} />Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <Input placeholder="Search entity type…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
            </div>
            <Select value={entityType} onChange={(v) => { setEntityType(v); setPage(1); }} className="w-40">
              <option value="">All types</option>
              <option value="SuperAdmin">SuperAdmin</option>
              <option value="User">User</option>
              <option value="Organization">Organization</option>
              <option value="Depot">Depot</option>
              <option value="Product">Product</option>
              <option value="Order">Order</option>
              <option value="PurchaseOrder">PurchaseOrder</option>
              <option value="FinancialTransaction">FinancialTransaction</option>
              <option value="StockBatch">StockBatch</option>
            </Select>
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-600 dark:text-slate-400">From:</label>
              <Input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }} className="w-40" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-600 dark:text-slate-400">To:</label>
              <Input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }} className="w-40" />
            </div>
            {(search || entityType || fromDate || toDate) && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setEntityType(""); setFromDate(""); setToDate(""); setPage(1); }}>Clear</Button>
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
              <span>No audit logs found</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs text-slate-500">{fmtDate(log.createdAt)}</TableCell>
                    <TableCell className="text-sm">
                      {log.platformUserId ? (
                        <span className="text-purple-600 dark:text-purple-400 font-medium">SuperAdmin #{log.userId ?? "?"}</span>
                      ) : log.userId ? (
                        <span>#{log.userId}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        {esc(log.action)}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className="text-slate-500 mono">{esc(log.entityType)}</span>
                      <span className="text-slate-400 mono ml-1">#{log.entityId}</span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-400">{esc(log.ipAddress || "—")}</TableCell>
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
    </div>
  );
}
