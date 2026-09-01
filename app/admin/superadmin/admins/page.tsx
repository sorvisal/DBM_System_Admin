"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRequireSuperAdmin } from "@/lib/platform";
import {
  listSuperAdmins,
  createSuperAdmin,
  toggleSuperAdmin,
  resetSuperAdminPassword,
  deleteSuperAdmin,
  assignDepotsToAdmin,
  removeDepotFromAdmin,
  listAllOrganizations,
} from "@/lib/api/superadmin";
import { getDepots } from "@/lib/api/depots";
import type { DepotDto } from "@/lib/types/depot";
import type { AdminSummaryDto as SuperAdminSummaryDto } from "@/lib/types/superadmin";
import { esc, fmtDate, generatePassword } from "@/components/ui";
import { useToast } from "@/components/toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter, Key, UserPlus } from "lucide-react";

export default function SuperAdminAdminsPage() {
  const isSuperAdmin = useRequireSuperAdmin();
  const { toast } = useToast();

  const [rows, setRows] = useState<SuperAdminSummaryDto[]>([]);
  const [meta, setMeta] = useState<{ page: number; pageSize: number; total: number; totalPages: number } | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [active, setActive] = useState("");
  const [orgId, setOrgId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [orgs, setOrgs] = useState<{ id: number; name: string }[]>([]);
  const [depots, setDepots] = useState<{ id: number; name: string; code: string; orgId: number }[]>([]);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ username: "", fullName: "", email: "", phone: "", role: "admin", depotId: "" });
  const [createBusy, setCreateBusy] = useState(false);
  const [createError, setCreateError] = useState("");

  const [pwTarget, setPwTarget] = useState<SuperAdminSummaryDto | null>(null);
  const [pwValue, setPwValue] = useState("");
  const [pwBusy, setPwBusy] = useState(false);

  const [showDepots, setShowDepots] = useState<SuperAdminSummaryDto | null>(null);
  const [depotCheckboxes, setDepotCheckboxes] = useState<Record<number, boolean>>({});
  const [depotBusy, setDepotBusy] = useState(false);

  const [showDelete, setShowDelete] = useState<SuperAdminSummaryDto | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const json = await listSuperAdmins({
        page, pageSize: 20,
        search: search || undefined,
        role: role || undefined,
        active: active || undefined,
        orgId: orgId ? parseInt(orgId) : undefined,
      });
      setRows(json.data ?? []);
      setMeta(json.meta ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [page, search, role, active, orgId]);

  useEffect(() => {
    listAllOrganizations().then((json) => {
      if (json.success) setOrgs((json.data as any[]) ?? []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (orgId) {
      getDepots(parseInt(orgId)).then((json) => {
        if (json.success) setDepots((json.data ?? []) as any[]);
      }).catch(() => {});
    } else {
      setDepots([]);
    }
  }, [orgId]);

  if (!isSuperAdmin) return null;

  const pages = meta?.totalPages ?? 1;

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreateError("");
    if (!createForm.fullName.trim() || !createForm.role) {
      setCreateError("Full name and role are required");
      return;
    }
    setCreateBusy(true);
    try {
      const res = await createSuperAdmin({
        username: createForm.username || createForm.email || `user_${Date.now()}`,
        fullName: createForm.fullName.trim(),
        email: createForm.email?.trim() || null,
        phone: createForm.phone?.trim() || null,
        role: createForm.role,
        depotId: createForm.depotId ? parseInt(createForm.depotId) : null,
        organizationId: orgId ? parseInt(orgId) : null,
      });
      if (res.success) {
        toast("Admin created", "ok");
        setShowCreate(false);
        setCreateForm({ username: "", fullName: "", email: "", phone: "", role: "admin", depotId: "" });
        load();
      } else {
        setCreateError(res.error || "Failed to create");
      }
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed");
    } finally {
      setCreateBusy(false);
    }
  }

  async function toggleAdmin(a: SuperAdminSummaryDto) {
    try {
      await toggleSuperAdmin(a.id);
      toast(`${a.fullName} ${a.isActive ? "disabled" : "enabled"}`, "ok");
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Update failed", "err");
    }
  }

  function openPw(a: SuperAdminSummaryDto) {
    setPwTarget(a);
    setPwValue(generatePassword());
  }

  async function doResetPassword() {
    if (!pwTarget) return;
    if (pwValue.length < 8) { toast("Password must be at least 8 characters", "err"); return; }
    const strengthRe = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
    if (!strengthRe.test(pwValue)) { toast("Password must contain uppercase, lowercase, and a number", "err"); return; }
    setPwBusy(true);
    try {
      await resetSuperAdminPassword(pwTarget.id, pwValue);
      toast(`Password reset for ${esc(pwTarget.fullName)}`, "ok");
      setPwTarget(null);
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Reset failed", "err");
    } finally {
      setPwBusy(false);
    }
  }

  function openDepotsManager(a: SuperAdminSummaryDto) {
    setDepotCheckboxes({});
    setShowDepots(a);
  }

  async function saveDepotAssignments() {
    if (!showDepots) return;
    const assigned = Object.entries(depotCheckboxes).filter(([, v]) => v).map(([k]) => parseInt(k));
    setDepotBusy(true);
    try {
      await assignDepotsToAdmin(showDepots.id, assigned);
      toast("Depot assignments updated", "ok");
      setShowDepots(null);
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "err");
    } finally {
      setDepotBusy(false);
    }
  }

  async function removeDepotAssignment(depotId: number) {
    if (!showDepots) return;
    try {
      await removeDepotFromAdmin(showDepots.id, depotId);
      setDepotCheckboxes((prev) => { const next = { ...prev }; delete next[depotId]; return next; });
      toast("Depot removed", "ok");
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "err");
    }
  }

  async function deleteAdminHandler() {
    if (!showDelete) return;
    setDeleteBusy(true);
    try {
      await deleteSuperAdmin(showDelete.id);
      toast(`Deleted ${showDelete.fullName}`, "ok");
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Admin Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage all organization admins across the platform.</p>
        </div>
        <Button onClick={() => {
          setCreateForm({ username: "", fullName: "", email: "", phone: "", role: "admin", depotId: "" });
          setCreateError(""); setShowCreate(true);
        }}>
          <UserPlus size={15} />
          Create Admin
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm"><Filter size={14} />Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <Input placeholder="Search name / username…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
            </div>
            <Select value={role} onChange={(v) => { setRole(v); setPage(1); }} className="w-32">
              <option value="">All roles</option>
              <option value="admin">admin</option>
              <option value="manager">manager</option>
              <option value="staff">staff</option>
              <option value="viewer">viewer</option>
            </Select>
            <Select value={active} onChange={(v) => { setActive(v); setPage(1); }} className="w-32">
              <option value="">All status</option>
              <option value="true">Active</option>
              <option value="false">Disabled</option>
            </Select>
            <Select value={orgId} onChange={(v) => { setOrgId(v); setPage(1); }} className="w-40">
              <option value="">All orgs</option>
              {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </Select>
            {(search || role || active || orgId) && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setRole(""); setActive(""); setOrgId(""); setPage(1); }}>Clear</Button>
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
              <span>No admins found</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div className="font-medium text-sm">{esc(a.fullName)}</div>
                      <div className="text-xs text-slate-400 mono">@{esc(a.username)}</div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        a.role === "admin" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                        a.role === "manager" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" :
                        "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      }`}>
                        {a.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${a.isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`}>
                        {a.isActive ? "Active" : "Disabled"}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">Org #{a.organizationId}</TableCell>
                    <TableCell className="text-xs text-slate-400 mono">{a.lastLoginAt ? fmtDate(a.lastLoginAt) : "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 flex-wrap">
                        <Button variant="ghost" size="sm" onClick={() => openDepotsManager(a)} title="Manage depots"><UserPlus size={13} /></Button>
                        <Button variant="ghost" size="sm" onClick={() => openPw(a)} title="Reset password"><Key size={13} /></Button>
                        <Button variant="ghost" size="sm" className={a.isActive ? "text-red-500" : "text-emerald-500"} onClick={() => toggleAdmin(a)}>
                          {a.isActive ? "Disable" : "Enable"}
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => setShowDelete(a)}>Delete</Button>
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

      {/* Create Admin Dialog */}
      <Dialog
        open={showCreate} onOpenChange={setShowCreate}
        title="Create Admin" description="Add a new organization admin account."
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCreate(false)} disabled={createBusy}>Cancel</Button>
            <Button onClick={(e) => (document.getElementById("create-admin-form") as HTMLFormElement)?.requestSubmit()} disabled={createBusy}>{createBusy ? "Creating…" : "Create"}</Button>
          </>
        }
      >
        <form id="create-admin-form" onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Full name *</label>
              <Input required value={createForm.fullName} onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Username</label>
              <Input value={createForm.username} onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Email</label>
              <Input type="email" value={createForm.email ?? ""} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Phone</label>
              <Input value={createForm.phone ?? ""} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Role *</label>
              <Select value={createForm.role} onChange={(v) => setCreateForm({ ...createForm, role: v })}>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="staff">Staff</option>
                <option value="viewer">Viewer</option>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Organization</label>
              <Select value={orgId} onChange={(v) => setOrgId(v)}>
                <option value="">Select org…</option>
                {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </Select>
            </div>
          </div>
          {orgId && depots.length > 0 && (
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Assign depot (optional)</label>
              <Select value={createForm.depotId} onChange={(v) => setCreateForm({ ...createForm, depotId: v })}>
                <option value="">No depot</option>
                {depots.map((d) => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
              </Select>
            </div>
          )}
          {createError && <p className="text-sm text-red-500">{createError}</p>}
        </form>
      </Dialog>

      {/* Password reset Dialog */}
      <Dialog
        open={!!pwTarget} onOpenChange={(v) => { if (!v) setPwTarget(null); }}
        title="Reset Password" description={`Reset password for ${pwTarget ? esc(pwTarget.fullName) : ""}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPwTarget(null)} disabled={pwBusy}>Cancel</Button>
            <Button type="button" onClick={() => doResetPassword()} disabled={pwBusy}>{pwBusy ? "Saving…" : "Save"}</Button>
          </>
        }
      >
        <form onSubmit={(e) => { e.preventDefault(); doResetPassword(); }} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">New password</label>
            <Input type="text" required value={pwValue} onChange={(e) => setPwValue(e.target.value)} />
            <p className="text-xs text-slate-400 mt-1">At least 8 chars, uppercase, lowercase, and a number.</p>
          </div>
        </form>
      </Dialog>

      {/* Depot assignments Dialog */}
      <Dialog
        open={!!showDepots} onOpenChange={(v) => { if (!v) setShowDepots(null); }}
        title="Manage Depots" description={`${showDepots ? esc(showDepots.fullName) : ""} — assign or remove depots`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowDepots(null)} disabled={depotBusy}>Cancel</Button>
            <Button type="button" onClick={saveDepotAssignments} disabled={depotBusy}>{depotBusy ? "Saving…" : "Save"}</Button>
          </>
        }
      >
        {showDepots && (
          <div className="space-y-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">Check depots to assign, uncheck to remove.</p>
            {depots.map((d) => (
              <label key={d.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!depotCheckboxes[d.id]}
                  onChange={(e) => setDepotCheckboxes({ ...depotCheckboxes, [d.id]: e.target.checked })}
                />
                {esc(d.name)} <span className="text-xs text-slate-400 mono">({esc(d.code)})</span>
                {depotCheckboxes[d.id] && (
                  <button type="button" onClick={() => removeDepotAssignment(d.id)} className="ml-auto text-red-500 text-xs hover:underline">Remove</button>
                )}
              </label>
            ))}
            {depots.length === 0 && <p className="text-sm text-slate-400">No depots available for this organization.</p>}
          </div>
        )}
      </Dialog>

      {/* Delete confirm */}
      <Dialog
        open={!!showDelete} onOpenChange={(v) => { if (!v) setShowDelete(null); }}
        title="Delete Admin" description={showDelete ? `Permanently delete ${showDelete.fullName}?` : ""}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowDelete(null)} disabled={deleteBusy}>Cancel</Button>
            <Button variant="destructive" onClick={deleteAdminHandler} disabled={deleteBusy}>{deleteBusy ? "Deleting…" : "Delete"}</Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-400">This action cannot be undone. The account and all associated data will be permanently removed.</p>
      </Dialog>
    </div>
  );
}
