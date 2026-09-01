"use client";

import { useEffect, useState } from "react";
import { listCategories, createCategory, updateCategory, deleteCategory } from "@/lib/api/categories";
import type { CategoryDto, CategoryRequest } from "@/lib/types";
import { esc } from "@/components/ui";
import { useToast } from "@/components/toast";
import { ViewButton } from "@/components/ui/Modal";
import "@/components/modals/CategoryModal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";

export default function CategoriesPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editTarget, setEditTarget] = useState<CategoryDto | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listCategories()
      .then((r) => setCategories(r.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Name is required"); return; }
    setBusy(true); setError("");
    try {
      const result = await createCategory({ name: name.trim(), description: description.trim() || null } as CategoryRequest);
      toast("Category created", "ok");
      setShowCreate(false);
      setName(""); setDescription("");
      if (result.success && result.data) setCategories((prev) => [result.data!, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
      toast(err instanceof Error ? err.message : "Create failed", "err");
    } finally { setBusy(false); }
  }

  function openEdit(c: CategoryDto) {
    setEditTarget(c);
    setEditName(c.name ?? "");
    setEditDesc(c.description ?? "");
    setShowEdit(true);
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget || !editName.trim()) return;
    setBusy(true);
    try {
      const result = await updateCategory(editTarget.id, { name: editName.trim(), description: editDesc.trim() || null } as CategoryRequest);
      toast("Category updated", "ok");
      setShowEdit(false);
      if (result.success && result.data) setCategories((prev) => prev.map((c) => c.id === result.data!.id ? result.data! : c));
    } catch (err) {
      toast(err instanceof Error ? err.message : "Update failed", "err");
    } finally { setBusy(false); }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this category?")) return;
    try {
      await deleteCategory(id);
      toast("Category deleted", "ok");
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      toast(err instanceof Error ? err.message : "Delete failed", "err");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Categories</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Organize products into categories.</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={15} />
          New Category
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-sm text-slate-400 dark:text-slate-500 gap-2">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-30"><path d="M4 6h16M4 10h16M4 14h10" /></svg>
              <span>No categories found</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium text-sm">{esc(c.name)}</TableCell>
                    <TableCell className="text-sm text-slate-500 max-w-64 truncate">{esc(c.description ?? "")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <ViewButton data={{ id: c.id }} keyType="category" />
                        <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>Edit</Button>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(c.id)}>Delete</Button>
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
        title="Create Category"
        description="Add a new product category."
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCreate(false)} disabled={busy}>Cancel</Button>
            <Button onClick={(e) => (document.getElementById("create-cat-form") as HTMLFormElement)?.requestSubmit()} disabled={busy}>{busy ? "Saving…" : "Create"}</Button>
          </>
        }
      >
        <form id="create-cat-form" onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Name</label>
            <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Electronics, Clothing..." autoFocus />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Description</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Optional…" />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </form>
      </Dialog>

      <Dialog
        open={showEdit}
        onOpenChange={setShowEdit}
        title="Edit Category"
        description={editTarget ? esc(editTarget.name) : ""}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowEdit(false)} disabled={busy}>Cancel</Button>
            <Button onClick={(e) => (document.getElementById("edit-cat-form") as HTMLFormElement)?.requestSubmit()} disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
          </>
        }
      >
        {editTarget && (
          <form id="edit-cat-form" onSubmit={handleEditSave} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Name</label>
              <Input required value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Description</label>
              <Textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={3} />
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
}
