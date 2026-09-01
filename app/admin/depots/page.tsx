"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useRequireSuperAdmin } from "@/lib/platform";
import { apiGet, apiPost, apiPut } from "@/lib/api/client";
import type { DepotDto, DepotCreateRequest } from "@/lib/types/depot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/toast";
import { esc, fmtDate } from "@/components/ui";
import {
  ArrowLeft, MapPin, Plus, Edit, Trash2,
  Loader2, AlertCircle, Check, X,
} from "lucide-react";

export default function DepotsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const isSuperAdmin = useRequireSuperAdmin();
  const [depots, setDepots] = useState<DepotDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orgId, setOrgId] = useState<number | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<DepotCreateRequest>({ name: "", code: "", address: null, phone: null, description: null });
  const [createBusy, setCreateBusy] = useState(false);
  const [createError, setCreateError] = useState("");

  const [editTarget, setEditTarget] = useState<DepotDto | null>(null);
  const [editForm, setEditForm] = useState<DepotCreateRequest>({ name: "", code: "", address: null, phone: null, description: null });
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState("");

  useEffect(() => {
    if (!isSuperAdmin) return;
    // Get first org or use query param
    const urlParams = new URLSearchParams(window.location.search);
    const orgParam = urlParams.get("orgId");
    if (orgParam) {
      setOrgId(parseInt(orgParam));
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    if (!isSuperAdmin || !orgId) return;
    setLoading(true);
    apiGet<DepotDto[]>(`/organizations/${orgId}/depots`)
      .then((json) => {
        if (json.success) setDepots(json.data ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [isSuperAdmin, orgId]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!orgId) return;
    setCreateError("");
    if (!createForm.name.trim() || !createForm.code.trim()) {
      setCreateError("Name and code are required");
      return;
    }
    setCreateBusy(true);
    try {
      const res = await apiPost<DepotDto>(`/organizations/${orgId}/depots`, createForm);
      if (res.success) {
        toast("Depot created", "ok");
        setShowCreate(false);
        setCreateForm({ name: "", code: "", address: null, phone: null, description: null });
        const d = await apiGet<DepotDto[]>(`/organizations/${orgId}/depots`);
        if (d.success) setDepots(d.data ?? []);
      } else {
        setCreateError(res.error || "Failed to create");
      }
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed");
    } finally {
      setCreateBusy(false);
    }
  }

  function openEdit(d: DepotDto) {
    setEditTarget(d);
    setEditForm({ name: d.name, code: d.code, address: d.address, phone: d.phone, description: d.description });
    setEditError("");
  }

  async function handleEdit(e: FormEvent) {
    e.preventDefault();
    if (!orgId || !editTarget) return;
    setEditError("");
    setEditBusy(true);
    try {
      const res = await apiPut<DepotDto>(`/organizations/${orgId}/depots/${editTarget.id}`, {
        name: editForm.name.trim() || null,
        code: editForm.code.trim() || null,
        address: editForm.address,
        phone: editForm.phone,
        description: editForm.description,
        isActive: null,
      });
      if (res.success) {
        toast("Depot updated", "ok");
        setEditTarget(null);
        const d = await apiGet<DepotDto[]>(`/organizations/${orgId}/depots`);
        if (d.success) setDepots(d.data ?? []);
      } else {
        setEditError(res.error || "Failed");
      }
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed");
    } finally {
      setEditBusy(false);
    }
  }

  async function toggleActive(d: DepotDto) {
    if (!orgId) return;
    try {
      await apiPut<DepotDto>(`/organizations/${orgId}/depots/${d.id}`, {
        name: null, code: null, address: null, phone: null, description: null,
        isActive: !d.isActive,
      });
      toast(`Depot ${!d.isActive ? "activated" : "deactivated"}`, "ok");
      const depotsRes = await apiGet<DepotDto[]>(`/organizations/${orgId}/depots`);
      if (depotsRes.success) setDepots(depotsRes.data ?? []);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "err");
    }
  }

  if (!isSuperAdmin) return null;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.push("/platform")}>
          <ArrowLeft size={14} /> Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <MapPin size={20} className="text-blue-600" />
            Depots
          </h1>
          {orgId && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Organization #{orgId}</p>}
        </div>
        <div className="ml-auto">
          <select
            className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
            onChange={(e) => { setOrgId(parseInt(e.target.value) || null); }}
            value={orgId || ""}
          >
            <option value="">Select Organization…</option>
            <option value="1">Org #1 (demo)</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-red-500 py-8">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      ) : orgId ? (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">{depots.length} depot{depots.length !== 1 ? "s" : ""}</p>
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus size={13} /> New Depot
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {depots.length === 0 ? (
                <div className="text-center py-12 text-sm text-slate-400">
                  No depots yet. Create your first depot.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Default</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {depots.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{esc(d.name)}</TableCell>
                        <TableCell className="font-mono text-xs">{esc(d.code)}</TableCell>
                        <TableCell className="text-sm text-slate-500 max-w-48 truncate">{esc(d.address || "")}</TableCell>
                        <TableCell>
                          <Badge variant={d.isActive ? "ok" : "default"}>{d.isActive ? "Active" : "Inactive"}</Badge>
                        </TableCell>
                        <TableCell>{d.isDefault ? <Check size={14} className="text-green-500" /> : <span className="text-slate-300">—</span>}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEdit(d)}>
                              <Edit size={13} />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => toggleActive(d)}>
                              {d.isActive ? <X size={13} className="text-amber-500" /> : <Check size={13} className="text-green-500" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-sm text-slate-400">
            Select an organization above to view its depots.
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog
        open={showCreate} onOpenChange={setShowCreate}
        title="Create Depot" description="Add a new depot to the organization."
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCreate(false)} disabled={createBusy}>Cancel</Button>
            <Button onClick={(e) => (document.getElementById("create-depot-form") as HTMLFormElement)?.requestSubmit()} disabled={createBusy}>
              {createBusy ? "Creating…" : "Create"}
            </Button>
          </>
        }
      >
        <form id="create-depot-form" onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Name *</label>
              <Input required value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Code *</label>
              <Input required value={createForm.code} onChange={(e) => setCreateForm({ ...createForm, code: e.target.value.toUpperCase() })} placeholder="MAIN" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Address</label>
            <Input value={createForm.address ?? ""} onChange={(e) => setCreateForm({ ...createForm, address: e.target.value || null })} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Phone</label>
            <Input value={createForm.phone ?? ""} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value || null })} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Description</label>
            <Textarea value={createForm.description ?? ""} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value || null })} rows={2} />
          </div>
          {createError && <p className="text-sm text-red-500">{createError}</p>}
        </form>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editTarget} onOpenChange={(v) => { if (!v) setEditTarget(null); }}
        title="Edit Depot" description={editTarget ? esc(editTarget.name) : ""}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditTarget(null)} disabled={editBusy}>Cancel</Button>
            <Button onClick={(e) => (document.getElementById("edit-depot-form") as HTMLFormElement)?.requestSubmit()} disabled={editBusy}>
              {editBusy ? "Saving…" : "Save"}
            </Button>
          </>
        }
      >
        {editTarget && (
          <form id="edit-depot-form" onSubmit={handleEdit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Name</label>
                <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Code</label>
                <Input value={editForm.code} onChange={(e) => setEditForm({ ...editForm, code: e.target.value.toUpperCase() })} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Address</label>
              <Input value={editForm.address ?? ""} onChange={(e) => setEditForm({ ...editForm, address: e.target.value || null })} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Phone</label>
              <Input value={editForm.phone ?? ""} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value || null })} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Description</label>
              <Textarea value={editForm.description ?? ""} onChange={(e) => setEditForm({ ...editForm, description: e.target.value || null })} rows={2} />
            </div>
            {editError && <p className="text-sm text-red-500">{editError}</p>}
          </form>
        )}
      </Dialog>
    </div>
  );
}
