"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { listProducts, createProduct, updateProduct, deleteProduct, uploadProductImage } from "@/lib/api/products";
import { listCategories } from "@/lib/api/categories";
import type { ProductDto, ProductUpsertRequest, CategoryDto } from "@/lib/types";
import { Modal, esc, fmtDate, fmtMoney, Badge } from "@/components/ui";
import { useToast } from "@/components/toast";
import { uploadsUrl } from "@/lib/api";
import { useProductEvents } from "@/lib/notifications";
import { ViewButton } from "@/components/ui/Modal";
import "@/components/modals/ProductModal";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Filter } from "lucide-react";

export default function ProductsPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [meta, setMeta] = useState<{ page: number; pageSize: number; total: number; totalPages: number } | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editTarget, setEditTarget] = useState<ProductDto | null>(null);
  const [form, setForm] = useState({ sku: "", name: "", categoryId: "", price: "", costPrice: "", stockQty: "", lowStockThreshold: "", expiryDate: "", manufactureDate: "", description: "", isActive: true, photoPath: "" });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [lowStock, setLowStock] = useState(false);
  const [categoryId, setCategoryId] = useState("");

  useEffect(() => {
    listCategories().then((r) => setCategories(r.data ?? [])).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const json = await listProducts({ page, pageSize: 20, search: search || undefined, categoryId: categoryId || undefined, lowStock });
      setProducts(json.data ?? []);
      setMeta(json.meta ?? null);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryId, lowStock]);

  useEffect(() => { load(); }, [load]);

  useProductEvents({
    onProductCreated(product) {
      setProducts((prev) => { if (prev.some((p) => p.id === product.id)) return prev; return [product, ...prev]; });
    },
    onProductUpdated(product) {
      setProducts((prev) => prev.map((p) => (p.id === product.id ? product : p)));
    },
    onProductDeleted(id) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
    },
    onStockAdjusted(payload) {
      setProducts((prev) => prev.map((p) => p.id === payload.productId ? { ...p, stockQty: payload.newStockQty, updatedAt: new Date().toISOString() } : p));
    },
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.sku.trim() || !form.name.trim() || !form.categoryId) { setError("SKU, name, and category are required"); return; }
    setBusy(true); setError("");
    try {
      const result = await createProduct({
        sku: form.sku.trim(), name: form.name.trim(), categoryId: parseInt(form.categoryId, 10),
        price: parseFloat(form.price), costPrice: parseFloat(form.costPrice),
        stockQty: parseInt(form.stockQty, 10), lowStockThreshold: parseInt(form.lowStockThreshold, 10),
        expiryDate: form.expiryDate ? form.expiryDate + "T00:00:00Z" : null,
        manufactureDate: form.manufactureDate ? form.manufactureDate + "T00:00:00Z" : null,
        description: form.description.trim() || null, isActive: form.isActive,
        photoPath: form.photoPath || null,
      } as ProductUpsertRequest);
      toast("Product created", "ok");
      setShowCreate(false);
      if (result.success && result.data) setProducts((prev) => [result.data!, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
      toast(err instanceof Error ? err.message : "Create failed", "err");
    } finally { setBusy(false); }
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    if (!form.sku.trim() || !form.name.trim() || !form.categoryId) { setError("SKU, name, and category are required"); return; }
    setBusy(true); setError("");
    try {
      const result = await updateProduct(editTarget.id, {
        sku: form.sku.trim(), name: form.name.trim(), categoryId: parseInt(form.categoryId, 10),
        price: parseFloat(form.price), costPrice: parseFloat(form.costPrice),
        stockQty: parseInt(form.stockQty, 10), lowStockThreshold: parseInt(form.lowStockThreshold, 10),
        expiryDate: form.expiryDate ? form.expiryDate + "T00:00:00Z" : null,
        manufactureDate: form.manufactureDate ? form.manufactureDate + "T00:00:00Z" : null,
        description: form.description.trim() || null, isActive: form.isActive,
        photoPath: form.photoPath || null,
      } as ProductUpsertRequest);
      toast("Product updated", "ok");
      setShowEdit(false);
      if (result.success && result.data) setProducts((prev) => prev.map((p) => p.id === result.data!.id ? result.data! : p));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
      toast(err instanceof Error ? err.message : "Update failed", "err");
    } finally { setBusy(false); }
  }

  function openEdit(p: ProductDto) {
    setEditTarget(p);
    setForm({ sku: p.sku, name: p.name, categoryId: String(p.categoryId), price: String(p.price), costPrice: String(p.costPrice), stockQty: String(p.stockQty), lowStockThreshold: String(p.lowStockThreshold), expiryDate: p.expiryDate ? p.expiryDate.slice(0, 10) : "", manufactureDate: p.manufactureDate ? p.manufactureDate.slice(0, 10) : "", description: p.description ?? "", isActive: p.isActive, photoPath: p.photoPath ?? "" });
    setPreviewUrl(uploadsUrl(p.photoPath));
    setError("");
    setShowEdit(true);
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const json = await uploadProductImage(file);
      if (json.success && json.data?.url) {
        setForm((f) => ({ ...f, photoPath: json.data!.url }));
        setPreviewUrl(uploadsUrl(json.data.url));
        toast("Image uploaded", "ok");
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Upload failed", "err");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this product?")) return;
    try {
      await deleteProduct(id);
      toast("Product deleted", "ok");
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      toast(err instanceof Error ? err.message : "Delete failed", "err");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Products</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage your product catalog and stock.</p>
        </div>
        <Link href="/admin/products/new">
          <Button>
            <Plus size={15} />
            New Product
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Filter size={14} />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <Input
                placeholder="Search products…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
            <Select value={categoryId} onChange={(v) => { setCategoryId(v); setPage(1); }} className="w-40">
              <option value="">All categories</option>
              {categories.map((c) => <option key={c.id} value={String(c.id)}>{esc(c.name)}</option>)}
            </Select>
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
              <input type="checkbox" checked={lowStock} onChange={(e) => { setLowStock(e.target.checked); setPage(1); }} className="rounded border-slate-300" />
              Low stock only
            </label>
            {(search || categoryId || lowStock) && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setCategoryId(""); setLowStock(false); setPage(1); }}>
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-sm text-slate-400 dark:text-slate-500 gap-2">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-30"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              <span>No products found</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id} style={p.stockQty <= p.lowStockThreshold ? { backgroundColor: "rgba(239,68,68,0.04)" } : undefined} className={p.stockQty <= p.lowStockThreshold ? "bg-red-50/50 dark:bg-red-950/20" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {p.photoPath ? (
                          <img src={uploadsUrl(p.photoPath)} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-medium text-slate-500 flex-shrink-0">
                            {esc(p.name.slice(0, 2).toUpperCase())}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-sm">{esc(p.name)}</div>
                          {p.description && <div className="text-xs text-slate-400 truncate max-w-48">{esc(p.description.slice(0, 40))}</div>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">{esc(p.sku)}</TableCell>
                    <TableCell className="text-sm">{esc(p.categoryName)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{fmtMoney(p.price)}</TableCell>
                    <TableCell className={`text-right font-mono text-sm font-semibold ${p.stockQty <= p.lowStockThreshold ? "text-red-500" : ""}`}>{p.stockQty}</TableCell>
                    <TableCell><Badge variant={p.isActive ? "ok" : "default"}>{p.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">{fmtDate(p.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <ViewButton data={{ productId: p.id, productName: p.name, sku: p.sku, categoryId: p.categoryId }} />
                        <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>Edit</Button>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(p.id)}>Delete</Button>
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

      {/* Create modal */}
      <Dialog
        open={showCreate}
        onOpenChange={setShowCreate}
        title="Create Product"
        description="Add a new product to inventory."
        wide
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCreate(false)} disabled={busy}>Cancel</Button>
            <Button onClick={(e) => (document.getElementById("create-product-form") as HTMLFormElement)?.requestSubmit()} disabled={busy}>{busy ? "Saving…" : "Create"}</Button>
          </>
        }
      >
        <form id="create-product-form" onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">SKU <span className="text-red-500">*</span></label>
              <Input required value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Category <span className="text-red-500">*</span></label>
              <select required value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))} className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm">
                <option value="">Select</option>
                {categories.map((c) => <option key={c.id} value={String(c.id)}>{esc(c.name)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Name <span className="text-red-500">*</span></label>
            <Input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Price <span className="text-red-500">*</span></label>
              <Input type="number" step="0.01" min="0" required value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Cost Price <span className="text-red-500">*</span></label>
              <Input type="number" step="0.01" min="0" required value={form.costPrice} onChange={(e) => setForm((f) => ({ ...f, costPrice: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Stock Qty <span className="text-red-500">*</span></label>
              <Input type="number" min="0" required value={form.stockQty} onChange={(e) => setForm((f) => ({ ...f, stockQty: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Low Stock Threshold <span className="text-red-500">*</span></label>
              <Input type="number" min="0" required value={form.lowStockThreshold} onChange={(e) => setForm((f) => ({ ...f, lowStockThreshold: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Expiry Date</label>
              <Input type="date" value={form.expiryDate} onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Manufacture Date</label>
              <Input type="date" value={form.manufactureDate} onChange={(e) => setForm((f) => ({ ...f, manufactureDate: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Description</label>
            <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Photo</label>
            <Input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoUpload} className="text-sm" />
          </div>
          {previewUrl && <img src={previewUrl} alt="preview" className="w-16 h-16 rounded-lg object-cover" />}
          {error && <p className="text-sm text-red-500">{error}</p>}
        </form>
      </Dialog>

      {/* Edit modal */}
      <Dialog
        open={showEdit}
        onOpenChange={setShowEdit}
        title="Edit Product"
        description={editTarget ? esc(editTarget.name) : ""}
        wide
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowEdit(false)} disabled={busy}>Cancel</Button>
            <Button onClick={(e) => (document.getElementById("edit-product-form") as HTMLFormElement)?.requestSubmit()} disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
          </>
        }
      >
        {editTarget && (
          <form id="edit-product-form" onSubmit={handleEditSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">SKU <span className="text-red-500">*</span></label>
                <Input required value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Category <span className="text-red-500">*</span></label>
                <select required value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))} className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm">
                  <option value="">Select</option>
                  {categories.map((c) => <option key={c.id} value={String(c.id)}>{esc(c.name)}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Name <span className="text-red-500">*</span></label>
              <Input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Price <span className="text-red-500">*</span></label>
                <Input type="number" step="0.01" min="0" required value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Cost Price <span className="text-red-500">*</span></label>
                <Input type="number" step="0.01" min="0" required value={form.costPrice} onChange={(e) => setForm((f) => ({ ...f, costPrice: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Stock Qty <span className="text-red-500">*</span></label>
                <Input type="number" min="0" required value={form.stockQty} onChange={(e) => setForm((f) => ({ ...f, stockQty: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Low Stock Threshold <span className="text-red-500">*</span></label>
                <Input type="number" min="0" required value={form.lowStockThreshold} onChange={(e) => setForm((f) => ({ ...f, lowStockThreshold: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Expiry Date</label>
                <Input type="date" value={form.expiryDate} onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Manufacture Date</label>
                <Input type="date" value={form.manufactureDate} onChange={(e) => setForm((f) => ({ ...f, manufactureDate: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Description</label>
              <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Photo</label>
              <Input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoUpload} className="text-sm" />
            </div>
            {previewUrl && <img src={previewUrl} alt="preview" className="w-16 h-16 rounded-lg object-cover" />}
            {error && <p className="text-sm text-red-500">{error}</p>}
          </form>
        )}
      </Dialog>
    </div>
  );
}
