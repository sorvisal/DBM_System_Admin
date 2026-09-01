"use client";

import { useEffect, useState, type FormEvent } from "react";
import { listOrganizations, createOrganization, updateOrganization, deleteOrganization } from "@/lib/api/organizations";
import type { OrganizationDto, OrganizationCreateRequest, OrganizationUpdateRequest } from "@/lib/types";
import { esc, fmtDate } from "@/components/ui";
import { useToast } from "@/components/toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";

export default function OrganizationsPage() {
  const { toast } = useToast();
  const [orgs, setOrgs] = useState<OrganizationDto[]>([]);
  const [meta, setMeta] = useState<{ page: number; pageSize: number; total: number; totalPages: number } | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editTarget, setEditTarget] = useState<OrganizationDto | null>(null);
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorForm, setErrorForm] = useState("");

  async function load() {
    setLoading(true);
    try {
      const json = await listOrganizations(page, 20);
      setOrgs(json.data ?? []);
      setMeta(json.meta ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [page]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!formName.trim() || !formSlug.trim()) { setErrorForm("Name and slug are required"); return; }
    setBusy(true);
    setErrorForm("");
    try {
      await createOrganization({ name: formName.trim(), slug: formSlug.trim().toLowerCase().replace(/\s+/g, "-"), description: formDesc.trim() || null } as OrganizationCreateRequest);
      toast("Organization created", "ok");
      setShowCreate(false);
      setFormName(""); setFormSlug(""); setFormDesc("");
      await load();
    } catch (err) {
      setErrorForm(err instanceof Error ? err.message : "Create failed");
      toast(err instanceof Error ? err.message : "Create failed", "err");
    } finally {
      setBusy(false);
    }
  }

  async function handleEdit(e: FormEvent) {
    e.preventDefault();
    if (!editTarget || !formName.trim()) { setErrorForm("Name is required"); return; }
    setBusy(true);
    setErrorForm("");
    try {
      await updateOrganization(editTarget.id, { name: formName.trim(), slug: formSlug.trim() || null, description: formDesc.trim() || null } as OrganizationUpdateRequest);
      toast("Organization updated", "ok");
      setShowEdit(false);
      await load();
    } catch (err) {
      setErrorForm(err instanceof Error ? err.message : "Update failed");
      toast(err instanceof Error ? err.message : "Update failed", "err");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(org: OrganizationDto) {
    if (!confirm(`Delete ${org.name}?`)) return;
    try {
      await deleteOrganization(org.id);
      toast("Organization deleted", "ok");
      setOrgs((prev) => prev.filter((o) => o.id !== org.id));
    } catch (err) {
      toast(err instanceof Error ? err.message : "Delete failed", "err");
    }
  }

  function openEdit(org: OrganizationDto) {
    setEditTarget(org);
    setFormName(org.name ?? "");
    setFormSlug(org.slug ?? "");
    setFormDesc(org.description ?? "");
    setErrorForm("");
    setShowEdit(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Organizations</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage multi-tenant organizations.</p>
        </div>
        <Button onClick={() => { setFormName(""); setFormSlug(""); setFormDesc(""); setShowCreate(true); }}>
          <Plus size={15} />
          New Organization
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : error ? (
            <div className="p-4 text-sm text-red-500">{error}</div>
          ) : orgs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-sm text-slate-400 dark:text-slate-500 gap-2">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-30"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
              <span>No organizations</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orgs.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium text-sm">{esc(o.name)}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">{esc(o.slug)}</TableCell>
                    <TableCell className="text-sm text-slate-500 dark:text-slate-400 max-w-48 truncate">{esc(o.description ?? "")}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">{fmtDate(o.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(o)}>Edit</Button>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(o)}>Delete</Button>
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
        open={showCreate} onOpenChange={setShowCreate} title="Create Organization" description="Add a new tenant organization."
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCreate(false)} disabled={busy}>Cancel</Button>
            <Button onClick={(e) => (document.getElementById("create-org-form") as HTMLFormElement)?.requestSubmit()} disabled={busy}>{busy ? "Saving…" : "Create"}</Button>
          </>
        }
      >
        <form id="create-org-form" onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Name</label>
            <Input required value={formName} onChange={(e) => setFormName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Slug</label>
            <Input required value={formSlug} onChange={(e) => setFormSlug(e.target.value)} placeholder="my-org" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Description</label>
            <Textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} rows={3} />
          </div>
          {errorForm && <p className="text-sm text-red-500">{errorForm}</p>}
        </form>
      </Dialog>

      <Dialog
        open={showEdit} onOpenChange={setShowEdit} title="Edit Organization" description={editTarget ? esc(editTarget.name) : ""}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowEdit(false)} disabled={busy}>Cancel</Button>
            <Button onClick={(e) => (document.getElementById("edit-org-form") as HTMLFormElement)?.requestSubmit()} disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
          </>
        }
      >
        {editTarget && (
          <form id="edit-org-form" onSubmit={handleEdit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Name</label>
              <Input required value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Slug</label>
              <Input value={formSlug} onChange={(e) => setFormSlug(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Description</label>
              <Textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} rows={3} />
            </div>
            {errorForm && <p className="text-sm text-red-500">{errorForm}</p>}
          </form>
        )}
      </Dialog>
    </div>
  );
}
