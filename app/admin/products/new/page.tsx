"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createProduct, uploadProductImage } from "@/lib/api/products";
import { listCategories } from "@/lib/api/categories";
import type { ProductUpsertRequest, CategoryDto } from "@/lib/types";
import { esc } from "@/components/ui";
import { useToast } from "@/components/toast";
import { uploadsUrl } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";

export default function NewProductPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [form, setForm] = useState({ sku: "", name: "", categoryId: "", price: "", costPrice: "", stockQty: "", lowStockThreshold: "", expiryDate: "", manufactureDate: "", description: "", isActive: true, photoPath: "" });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    listCategories().then((r) => setCategories(r.data ?? [])).catch(() => {});
  }, []);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.sku.trim() || !form.name.trim() || !form.categoryId) { setError("SKU, name, and category are required"); return; }
    setBusy(true);
    setError("");
    try {
      await createProduct({
        sku: form.sku.trim(), name: form.name.trim(), categoryId: parseInt(form.categoryId, 10),
        price: parseFloat(form.price), costPrice: parseFloat(form.costPrice),
        stockQty: parseInt(form.stockQty, 10), lowStockThreshold: parseInt(form.lowStockThreshold, 10),
        expiryDate: form.expiryDate ? form.expiryDate + "T00:00:00Z" : null,
        manufactureDate: form.manufactureDate ? form.manufactureDate + "T00:00:00Z" : null,
        description: form.description.trim() || null, isActive: form.isActive,
        photoPath: form.photoPath || null,
      } as ProductUpsertRequest);
      toast("Product created", "ok");
      router.push("/admin/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
      toast(err instanceof Error ? err.message : "Create failed", "err");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-3 gap-2">
          <ArrowLeft size={14} /> Back
        </Button>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">New Product</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Add a new product to inventory.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">SKU <span className="text-red-500">*</span></label>
                <Input required value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Category <span className="text-red-500">*</span></label>
                <select required value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))} className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm">
                  <option value="">Select…</option>
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
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" type="button" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Create Product"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
