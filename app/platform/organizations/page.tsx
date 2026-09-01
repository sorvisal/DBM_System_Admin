"use client";

import { useEffect, useState } from "react";
import { listPlatformOrganizations } from "@/lib/api/organizations";
import type { OrganizationDto } from "@/lib/types";
import { esc, fmtDate } from "@/components/ui";
import { useToast } from "@/components/toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Shield, Building2, Search, Filter } from "lucide-react";

export default function OrganizationsPage() {
  const { toast } = useToast();
  const [orgs, setOrgs] = useState<OrganizationDto[]>([]);
  const [meta, setMeta] = useState<{ page: number; pageSize: number; total: number; totalPages: number } | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const json = await listPlatformOrganizations(page, 20, search || undefined, status || undefined);
      if (json.success) {
        setOrgs(json.data ?? []);
        setMeta(json.meta ?? null);
      } else {
        setError(json.error ?? "Failed to load organizations");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  useEffect(() => {
    load();
  }, [page, search, status]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => window.location.href = "/platform"}>
          ← Back to Platform
        </Button>
        <div className="flex-1" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Building2 size={20} className="text-blue-600" />
            Organizations
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage all tenant organizations</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <Input
                placeholder="Search organizations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={status} onChange={(v) => setStatus(v)} className="w-40">
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
              <option value="Cancelled">Cancelled</option>
            </Select>
            {(search || status) && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setStatus(""); }}>
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <div className="text-red-500 text-sm mb-2">{error}</div>
              <Button variant="outline" size="sm" onClick={load}>Retry</Button>
            </div>
          ) : orgs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-sm text-slate-400 gap-2">
              <Shield size={32} className="opacity-30" />
              <span>No organizations found</span>
              <p className="text-xs">Create organizations from the Platform Dashboard</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orgs.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium text-sm">{esc(o.name || "")}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">{esc(o.slug || "")}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        o.status === "Active" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                        o.status === "Suspended" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                        "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      }`}>
                        {o.status || "Unknown"}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">{fmtDate(o.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => (window.location.href = `/platform/organizations/${o.id}`)}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 text-sm text-slate-500">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Prev
            </button>
            <span>Page {page} of {meta.totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page >= meta.totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Next
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}
