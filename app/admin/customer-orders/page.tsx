"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  listCustomerOrderLinks,
  getCustomerOrderLinksSummary,
  createCustomerOrderLink,
  updateCustomerOrderLink,
  deleteCustomerOrderLink,
  activateCustomerOrderLink,
  deactivateCustomerOrderLink,
  regenerateCustomerOrderLinkToken,
} from "@/lib/api/customerOrderLinks";
import type { CustomerOrderLinkDto } from "@/lib/types/customerOrderLink";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/toast";
import { useOrderEvents } from "@/lib/notifications";
import QRCode from "qrcode";
import {
  Copy, Download, ExternalLink, Link2, Plus, Printer, QrCode as QrCodeIcon,
  RefreshCw, Search, ShoppingCart, Trash2, Zap, ZapOff, Clock, Pencil,
  Send, MessageCircle, Mail, MessageSquare, Share2,
} from "lucide-react";

interface Summary {
  totalLinks: number;
  activeLinks: number;
  expiredLinks: number;
  ordersCreated: number;
}

const emptyForm = {
  name: "",
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  expiresAt: "",
  maxUses: "",
  isActive: "true",
  notes: "",
};

export default function CustomerOrdersPage() {
  const { toast } = useToast();
  const [links, setLinks] = useState<CustomerOrderLinkDto[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [meta, setMeta] = useState<{ page: number; totalPages: number; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  // create / edit dialog
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // QR modal
  const [qrLink, setQrLink] = useState<CustomerOrderLinkDto | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");

  // Generated-link dialog (main output of the feature: the shareable URL)
  const [generated, setGenerated] = useState<CustomerOrderLinkDto | null>(null);

  const displayName = (l: CustomerOrderLinkDto) => l.name || l.customerName || "Customer Ordering";

  const load = useCallback(async function load() {
    setLoading(true);
    try {
      const json = await listCustomerOrderLinks({
        page, pageSize: 20, search: search || undefined, status: statusFilter,
      });
      setLinks(json.data ?? []);
      setMeta(json.meta ?? null);
    } catch {
      /* errors surfaced by caller */
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  // Live updates: new portal orders and admin approvals refresh this page without reload.
  useOrderEvents({
    onOrderCreated: (p) => {
      toast(`New customer order ${p.code} received`, "ok");
      load();
    },
    onOrderStatusChanged: () => {
      load();
    },
  });

  useEffect(() => {
    getCustomerOrderLinksSummary()
      .then((json) => { if (json.success && json.data) setSummary(json.data); })
      .catch(() => {});
  }, [links]);

  async function generateQr(url: string) {
    try {
      return await QRCode.toDataURL(url, {
        errorCorrectionLevel: "H",
        width: 512,
        margin: 2,
        color: { dark: "#17304f", light: "#ffffff" },
      });
    } catch {
      return "";
    }
  }

  async function openQr(link: CustomerOrderLinkDto) {
    setQrLink(link);
    setQrDataUrl(await generateQr(link.publicUrl));
  }

  async function copyText(text: string, message = "Copied") {
    try {
      await navigator.clipboard.writeText(text);
      toast(message, "ok");
    } catch {
      toast("Could not copy", "err");
    }
  }

  const copyUrl = useCallback((link: CustomerOrderLinkDto) => copyText(link.publicUrl, "Ordering link copied"), [toast]);

  function downloadQr(link: CustomerOrderLinkDto, dataUrl?: string) {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `order-qr-${link.token}.png`;
    a.click();
  }

  function printQr(link: CustomerOrderLinkDto) {
    if (!qrDataUrl) return;
    const win = window.open("", "_blank", "width=480,height=640");
    if (!win) return;
    win.document.write(
      `<html><head><title>QR — ${displayName(link)}</title></head>` +
      `<body style="font-family:Arial;text-align:center;padding:24px">` +
      `<h2 style="margin-bottom:4px">${displayName(link)}</h2>` +
      `<p style="color:#555;margin-top:0">${link.publicUrl}</p>` +
      `<img src="${qrDataUrl}" style="width:340px;height:340px"/>` +
      `<p style="color:#777;font-size:12px">Scan to browse products &amp; order</p></body></html>`,
    );
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  }

  /** External share targets — we only provide URLs; the messaging apps do the rest. */
  function shareTargets(link: CustomerOrderLinkDto) {
    const url = link.publicUrl;
    const label = encodeURIComponent(displayName(link));
    const msg = encodeURIComponent(`Order from ${displayName(link)} here:`);
    return [
      { key: "telegram", label: "Telegram", icon: Send, href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${msg}` },
      { key: "whatsapp", label: "WhatsApp", icon: MessageCircle, href: `https://wa.me/?text=${encodeURIComponent(msg + " " + url)}` },
      { key: "messenger", label: "Messenger", icon: MessageCircle, href: `fb-messenger://share/?link=${encodeURIComponent(url)}` },
      { key: "email", label: "Email", icon: Mail, href: `mailto:?subject=${encodeURIComponent("Customer ordering link")}&body=${encodeURIComponent(msg + "%0D%0A" + url)}` },
      { key: "sms", label: "SMS", icon: MessageSquare, href: `sms:?&body=${encodeURIComponent(msg + " " + url)}` },
      { key: "native", label: "More…", icon: Share2, href: "" , labelExtra: label, rawUrl: url },
    ];
  }

  async function openShare(target: { key: string; label: string; href: string; rawUrl?: string }, link: CustomerOrderLinkDto) {
    if (target.key === "messenger") {
      await copyText(link.publicUrl, "Link copied — paste it in Messenger");
    }
    if (target.key === "native") {
      if (typeof navigator !== "undefined" && "share" in navigator) {
        try {
          await navigator.share({ title: displayName(link), text: `Order from ${displayName(link)}`, url: link.publicUrl });
          return;
        } catch { /* user dismissed */ return; }
      }
      await copyText(link.publicUrl, "Link copied");
      window.open("https://t.me/share/url?url=" + encodeURIComponent(link.publicUrl), "_blank");
      return;
    }
    window.open(target.href, "_blank");
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setFormOpen(true);
  }

  function openEdit(link: CustomerOrderLinkDto) {
    setEditingId(link.id);
    setForm({
      name: link.name ?? "",
      customerName: link.customerName ?? "",
      customerPhone: link.customerPhone ?? "",
      customerEmail: link.customerEmail ?? "",
      expiresAt: link.expiresAt ? link.expiresAt.slice(0, 10) : "",
      maxUses: link.maxUses != null ? String(link.maxUses) : "",
      isActive: link.isActive ? "true" : "false",
      notes: link.notes ?? "",
    });
    setError("");
    setFormOpen(true);
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const body = {
        name: form.name.trim() || null,
        customerName: form.customerName.trim() || null,
        customerPhone: form.customerPhone.trim() || null,
        customerEmail: form.customerEmail.trim() || null,
        expiresAt: form.expiresAt ? new Date(form.expiresAt + "T23:59:59").toISOString() : null,
        maxUses: form.maxUses ? parseInt(form.maxUses, 10) : null,
        isActive: form.isActive === "true",
        notes: form.notes.trim() || null,
      };
      if (editingId != null) {
        await updateCustomerOrderLink(editingId, body);
        toast("Link updated", "ok");
        setFormOpen(false);
      } else {
        const result = await createCustomerOrderLink(body);
        toast("Customer order link generated", "ok");
        setFormOpen(false);
        setPage(1);
        await load();
        if (result.success && result.data) setGenerated(result.data); // show the shareable link immediately
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Save failed";
      setError(msg);
      toast(msg, "err");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(link: CustomerOrderLinkDto) {
    if (!confirm(`Delete "${displayName(link)}"? Customers will no longer be able to order through it.`)) return;
    try {
      await deleteCustomerOrderLink(link.id);
      toast("Link deleted", "ok");
      setLinks((prev) => prev.filter((l) => l.id !== link.id));
    } catch (err) {
      toast(err instanceof Error ? err.message : "Delete failed", "err");
    }
  }

  async function handleToggleActive(link: CustomerOrderLinkDto) {
    try {
      const json = link.isActive
        ? await deactivateCustomerOrderLink(link.id)
        : await activateCustomerOrderLink(link.id);
      if (json.success && json.data) {
        setLinks((prev) => prev.map((l) => (l.id === link.id ? json.data! : l)));
        toast(json.data.isActive ? "Link activated" : "Link disabled", "ok");
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Action failed", "err");
    }
  }

  async function handleRegenerate(link: CustomerOrderLinkDto) {
    if (!confirm(`Generate a new URL for "${displayName(link)}"? The old shared link/QR will stop working.`)) return;
    try {
      const json = await regenerateCustomerOrderLinkToken(link.id);
      if (json.success && json.data) {
        setLinks((prev) => prev.map((l) => (l.id === link.id ? json.data! : l)));
        toast("New link generated", "ok");
        setGenerated(json.data);
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Regeneration failed", "err");
    }
  }

  function statusBadge(link: CustomerOrderLinkDto) {
    const cls =
      link.status === "active"
        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
        : link.status === "expired"
          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
          : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400";
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${cls}`}>
        {link.status}
      </span>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Customer Orders</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Generate one shareable ordering link — send it to unlimited customers.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={15} />
          Generate Customer Order Link
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Links"
          value={String(summary?.totalLinks ?? 0)}
          subtitle="Created order links"
          icon={<Link2 size={16} />}
          iconColor="text-blue-500"
        />
        <StatCard
          label="Active Links"
          value={String(summary?.activeLinks ?? 0)}
          subtitle="Currently enabled"
          icon={<Zap size={16} />}
          iconColor="text-emerald-500"
        />
        <StatCard
          label="Expired Links"
          value={String(summary?.expiredLinks ?? 0)}
          subtitle="Past expiration date"
          icon={<Clock size={16} />}
          iconColor="text-amber-500"
        />
        <StatCard
          label="Orders Created"
          value={String(summary?.ordersCreated ?? 0)}
          subtitle="Through all links"
          icon={<ShoppingCart size={16} />}
          iconColor="text-purple-500"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col sm:flex-row gap-3 p-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <Input
              placeholder="Search name, phone, email or token…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }} className="sm:w-44">
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="expired">Expired</option>
          </Select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : links.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-sm text-slate-400 dark:text-slate-500 gap-2">
              <QrCodeIcon size={34} strokeWidth={1.5} className="opacity-30" />
              <span>No ordering links yet. Generate one and share it with your customers.</span>
              <Button variant="outline" size="sm" onClick={openCreate}>
                <Plus size={14} /> Generate Customer Order Link
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Link</TableHead>
                  <TableHead>Contact (optional)</TableHead>
                  <TableHead>Order URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expiration</TableHead>
                  <TableHead className="text-right">Uses</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {links.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>
                      <button onClick={() => setGenerated(l)} title="Show shareable link" className="text-left">
                        <div className="font-medium text-sm hover:text-blue-600 hover:underline">{displayName(l)}</div>
                        <div className="font-mono text-xs text-slate-400">/order/{l.token}</div>
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-slate-600 dark:text-slate-300">{l.customerName || "—"}</div>
                      <div className="text-xs text-slate-400">{l.customerPhone || l.customerEmail || ""}</div>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => copyUrl(l)}
                        title="Copy URL"
                        className="font-mono text-xs text-blue-600 hover:underline dark:text-blue-400 flex items-center gap-1"
                      >
                        /order/{l.token}
                        <Copy size={11} />
                      </button>
                    </TableCell>
                    <TableCell>{statusBadge(l)}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">{new Date(l.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">
                      {l.expiresAt ? new Date(l.expiresAt).toLocaleDateString() : "Never"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {l.useCount}{l.maxUses != null ? ` / ${l.maxUses}` : " (∞)"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">{l.orderCount ?? 0}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <IconButton title="Show link & share" onClick={() => setGenerated(l)}><Link2 size={15} /></IconButton>
                        <IconButton title="Show QR" onClick={() => openQr(l)}><QrCodeIcon size={15} /></IconButton>
                        <IconButton title="Copy URL" onClick={() => copyUrl(l)}><Copy size={15} /></IconButton>
                        <a href={l.publicUrl} target="_blank" rel="noreferrer" title="Open ordering page">
                          <IconButton><ExternalLink size={15} /></IconButton>
                        </a>
                        <IconButton title="Download QR" onClick={async () => downloadQr(l, await generateQr(l.publicUrl))}>
                          <Download size={15} />
                        </IconButton>
                        <IconButton title="Edit" onClick={() => openEdit(l)}><Pencil size={15} /></IconButton>
                        <IconButton
                          title={l.isActive ? "Disable" : "Activate"}
                          onClick={() => handleToggleActive(l)}
                          className={l.isActive ? "text-amber-600 hover:text-amber-700" : "text-emerald-600 hover:text-emerald-700"}
                        >
                          {l.isActive ? <ZapOff size={15} /> : <Zap size={15} />}
                        </IconButton>
                        <IconButton title="Regenerate URL" onClick={() => handleRegenerate(l)}>
                          <RefreshCw size={15} />
                        </IconButton>
                        <IconButton title="Delete" onClick={() => handleDelete(l)} className="text-red-500 hover:text-red-600">
                          <Trash2 size={15} />
                        </IconButton>
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
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800">
              Prev
            </button>
            <span>Page {page} of {meta.totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))} disabled={page >= meta.totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800">
              Next
            </button>
          </div>
        )}
      </Card>

      {/* Create / Edit dialog */}
      <Dialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editingId != null ? "Edit Ordering Link" : "Generate Customer Order Link"}
        description={editingId != null
          ? "Update the link settings. The URL stays the same unless you regenerate it."
          : "A unique URL and QR code will be generated. One link works for unlimited customers."}
        footer={
          <>
            <Button variant="ghost" onClick={() => setFormOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={() => (document.getElementById("customer-order-link-form") as HTMLFormElement)?.requestSubmit()} disabled={busy}>
              {busy ? "Generating…" : editingId != null ? "Save changes" : "Generate Link"}
            </Button>
          </>
        }
      >
        <form id="customer-order-link-form" onSubmit={submitForm} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
              Link Name <span className="text-red-500">*</span>
            </label>
            <Input required autoFocus value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder='e.g. "Main Store Customer Ordering"' />
          </div>

          <details className="rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2">
            <summary className="text-sm font-medium text-slate-600 dark:text-slate-300 cursor-pointer select-none">
              Optional customer details
            </summary>
            <div className="pt-3 space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Customer Name</label>
                <Input value={form.customerName}
                  onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                  placeholder="Optional — leave empty for a shared link" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Phone</label>
                  <Input value={form.customerPhone}
                    onChange={(e) => setForm((f) => ({ ...f, customerPhone: e.target.value }))}
                    placeholder="Contact number…" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Email</label>
                  <Input type="email" value={form.customerEmail}
                    onChange={(e) => setForm((f) => ({ ...f, customerEmail: e.target.value }))}
                    placeholder="name@example.com" />
                </div>
              </div>
              <p className="text-xs text-slate-400">Every customer who opens the link registers their own account.</p>
            </div>
          </details>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Expiration Date</label>
              <Input type="date" value={form.expiresAt}
                onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))} />
              <p className="text-xs text-slate-400 mt-1">Leave empty — never expires.</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Maximum Uses</label>
              <Input type="number" min={1} value={form.maxUses}
                onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))}
                placeholder="Unlimited customers" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Status</label>
            <Select value={form.isActive} onChange={(v) => setForm((f) => ({ ...f, isActive: v }))}>
              <option value="true">Active — customers can order</option>
              <option value="false">Inactive — link blocked</option>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Notes</label>
            <Input value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Internal note…" />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </form>
      </Dialog>

      {/* Generated / shareable-link dialog — the main output of this feature */}
      <Dialog
        open={generated != null}
        onOpenChange={(open) => { if (!open) setGenerated(null); }}
        title="Customer Order Link"
        description="Send this link to your customers — anyone who opens it can register and order."
        wide
        footer={
          <>
            <Button variant="ghost" onClick={() => setGenerated(null)}>Close</Button>
            <Button variant="outline" onClick={async () => { if (generated) { setGenerated(null); openQr(generated); } }}>
              <QrCodeIcon size={15} /> Generate QR
            </Button>
            <Button onClick={async () => generated && copyText(generated.publicUrl, "Ordering link copied")}>
              <Copy size={15} /> Copy Link
            </Button>
          </>
        }
      >
        {generated && (
          <div className="space-y-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Name</div>
              <div className="text-base font-bold text-slate-900 dark:text-slate-50">{displayName(generated)}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">URL</div>
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2">
                <code className="text-sm break-all flex-1 min-w-0">{generated.publicUrl}</code>
                <button onClick={async () => copyText(generated.publicUrl, "Copied")} title="Copy"
                  className="text-slate-400 hover:text-blue-600 flex-shrink-0"><Copy size={16} /></button>
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Share via</div>
              <div className="flex flex-wrap gap-2">
                {shareTargets(generated).map((t) => (
                  <button key={t.key} onClick={() => openShare(t, generated)}
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <t.icon size={15} /> {t.label}
                  </button>
                ))}
                <a href={generated.publicUrl} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                  <ExternalLink size={15} /> Open ordering page
                </a>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Telegram · WhatsApp · Messenger · Email · SMS — the apps themselves send the message; you only need this URL or the QR code.
              </p>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900 rounded-lg px-3 py-2">
              ♾ Unlimited customers can use this link — each one registers their own account and gets their own orders.
              Products shown belong to your organization only.
            </p>
          </div>
        )}
      </Dialog>

      {/* QR modal */}
      <Dialog
        open={qrLink != null}
        onOpenChange={(open) => { if (!open) setQrLink(null); }}
        title="Ordering QR Code"
        description={qrLink ? displayName(qrLink) : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setQrLink(null)}>Close</Button>
            <Button variant="outline" onClick={() => qrLink && printQr(qrLink)}>
              <Printer size={15} /> Print
            </Button>
            <Button variant="outline" onClick={() => qrLink && downloadQr(qrLink, qrDataUrl)}>
              <Download size={15} /> Download PNG
            </Button>
            <Button onClick={() => qrLink && copyUrl(qrLink)}>
              <Copy size={15} /> Copy URL
            </Button>
          </>
        }
      >
        {qrLink && (
          <div className="flex flex-col items-center gap-4">
            {qrDataUrl ? (
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                <img src={qrDataUrl} alt={`QR code for ${displayName(qrLink)}`} width={240} height={240} />
              </div>
            ) : (
              <Skeleton className="w-[264px] h-[264px]" />
            )}
            <code className="text-xs bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2 break-all text-center max-w-full">
              {qrLink.publicUrl}
            </code>
            <a href={qrLink.publicUrl} target="_blank" rel="noreferrer"
              className="text-sm text-blue-600 hover:underline dark:text-blue-400 flex items-center gap-1">
              Open ordering page <ExternalLink size={13} />
            </a>
          </div>
        )}
      </Dialog>
    </div>
  );
}

function IconButton({
  children, onClick, title, className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 ${className}`}
    >
      {children}
    </button>
  );
}
