"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { apiGet, apiPost } from "@/lib/api/client";
import type { OrganizationDto } from "@/lib/types/organization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2, Users, ShoppingCart, DollarSign,
  Loader2, AlertCircle, Shield, Plus, RefreshCw,
  Package, Archive, FileText,
} from "lucide-react";
import { esc, fmtDate } from "@/components/ui";
import { useToast } from "@/components/toast";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRequireSuperAdmin } from "@/lib/platform";

interface PlatformStats {
  totalOrganizations: number;
  activeOrganizations: number;
  suspendedOrganizations: number;
  newOrganizationsToday: number;
  totalUsers: number;
  ordersToday: number;
  revenueToday: number;
}

export default function PlatformDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const isSuperAdmin = useRequireSuperAdmin();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [orgs, setOrgs] = useState<OrganizationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", slug: "", description: "", email: "", phone: "", currency: "USD", timeZone: "UTC" });
  const [createBusy, setCreateBusy] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    if (!isSuperAdmin) return;
    setLoading(true);
    Promise.all([
      apiGet<PlatformStats>("/platform/dashboard"),
      apiGet<{ data: OrganizationDto[]; meta: any }>("/platform/organizations?page=1&pageSize=10"),
    ])
      .then(([s, o]) => {
        if (s.success && s.data) setStats(s.data);
        if (o.success && o.data?.data) setOrgs(o.data.data);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [isSuperAdmin]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError("");
    if (!createForm.name.trim() || !createForm.slug.trim()) {
      setCreateError("Name and slug are required");
      return;
    }
    setCreateBusy(true);
    try {
      const res = await apiPost<any>("/platform/organizations", {
        name: createForm.name.trim(),
        slug: createForm.slug.trim().toLowerCase().replace(/\s+/g, "-"),
        description: createForm.description.trim() || null,
        email: createForm.email.trim() || null,
        phone: createForm.phone.trim() || null,
        currency: createForm.currency || "USD",
        timeZone: createForm.timeZone || "UTC",
      });
      if (res.success) {
        toast("Organization created", "ok");
        setShowCreate(false);
        setCreateForm({ name: "", slug: "", description: "", email: "", phone: "", currency: "USD", timeZone: "UTC" });
        const o = await apiGet<any>("/platform/organizations?page=1&pageSize=10");
        if (o.success) setOrgs(o.data ?? []);
        if (res.data?.organization) {
          const org = res.data.organization as OrganizationDto;
          router.push(`/platform/organizations/${org.id}`);
        }
      } else {
        setCreateError(res.error || "Failed to create");
      }
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setCreateBusy(false);
    }
  }

  async function toggleStatus(org: OrganizationDto, status: string) {
    try {
      await apiPost<boolean>(`/platform/organizations/${org.id}/${status === "suspended" ? "suspend" : "activate"}`);
      toast(`Organization ${status}d`, "ok");
      const o = await apiGet<any>("/platform/organizations?page=1&pageSize=10");
      if (o.success) setOrgs(o.data ?? []);
      if (stats) {
        const newStats = { ...stats };
        if (status === "suspended") {
          newStats.activeOrganizations = Math.max(0, (stats.activeOrganizations ?? 0) - 1);
          newStats.suspendedOrganizations = (stats.suspendedOrganizations ?? 0) + 1;
        } else {
          newStats.activeOrganizations = (stats.activeOrganizations ?? 0) + 1;
          newStats.suspendedOrganizations = Math.max(0, (stats.suspendedOrganizations ?? 0) - 1);
        }
        setStats(newStats);
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "err");
    }
  }

  if (!isSuperAdmin) return null;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Shield size={24} className="text-blue-600" />
            Platform Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Multi-tenant organization management</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw size={14} />
            Refresh
          </Button>
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={14} />
            New Organization
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-blue-600" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-red-500 py-8 bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      ) : stats ? (
        <>
          {/* Main stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total Organizations", value: stats.totalOrganizations, icon: Building2, color: "blue" },
              { label: "Active", value: stats.activeOrganizations, icon: Shield, color: "green" },
              { label: "Suspended", value: stats.suspendedOrganizations, icon: AlertCircle, color: "amber" },
              { label: "Total Users", value: stats.totalUsers, icon: Users, color: "purple" },
            ].map((card) => (
              <Card key={card.label}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{card.label}</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{card.value}</p>
                    </div>
                    <card.icon size={20} className={`text-${card.color}-500`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Secondary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Orders Today", value: stats.ordersToday, icon: ShoppingCart },
              { label: "Revenue Today", value: `$${(stats.revenueToday ?? 0).toFixed(2)}`, icon: DollarSign },
              { label: "New Today", value: stats.newOrganizationsToday, icon: Building2 },
              { label: "Go to Organizations", value: "", icon: null },
            ].map((card, idx) => (
              <Card key={idx}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{card.label}</p>
                      <p className="text-xl font-bold text-slate-900 dark:text-slate-50">{card.value}</p>
                    </div>
                    {card.icon && <card.icon size={18} className="text-slate-400" />}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Organizations list */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Building2 size={14} />
                  Recent Organizations
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => router.push("/platform/organizations")}>
                  View All →
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {orgs.length === 0 ? (
                <div className="text-center py-8 text-sm text-slate-400">
                  No organizations yet. Create one to get started.
                </div>
              ) : (
                <div className="space-y-2">
                  {orgs.map((org) => (
                    <div key={org.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                          {org.name?.[0]?.toUpperCase() || "O"}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{esc(org.name || "")}</div>
                          <div className="text-xs text-slate-400 font-mono">@{esc(org.slug || "")}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {org.status === "Active" ? (
                          <Badge variant="ok">Active</Badge>
                        ) : org.status === "Suspended" ? (
                          <Badge variant="warn">Suspended</Badge>
                        ) : (
                          <Badge variant="default">{org.status || "Unknown"}</Badge>
                        )}
                        <span className="text-xs text-slate-400">{fmtDate(org.createdAt)}</span>
                        <div className="flex gap-1">
                          {org.status !== "Suspended" && (
                            <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700 text-xs" onClick={() => toggleStatus(org, "suspended")}>
                              Suspend
                            </Button>
                          )}
                          {org.status === "Suspended" && (
                            <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700 text-xs" onClick={() => toggleStatus(org, "active")}>
                              Activate
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" className="text-xs" onClick={() => router.push(`/platform/organizations/${org.id}`)}>
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}

      {/* Create Organization Dialog */}
      <Dialog
        open={showCreate} onOpenChange={setShowCreate}
        title="Create Organization" description="Add a new tenant organization to the platform."
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCreate(false)} disabled={createBusy}>Cancel</Button>
            <Button onClick={(e) => (document.getElementById("create-org-form") as HTMLFormElement)?.requestSubmit()} disabled={createBusy}>{createBusy ? "Creating…" : "Create"}</Button>
          </>
        }
      >
        <form id="create-org-form" onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Organization Name *</label>
              <Input required value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Slug *</label>
              <Input required value={createForm.slug} onChange={(e) => setCreateForm({ ...createForm, slug: e.target.value })} placeholder="my-org" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Email</label>
              <Input type="email" value={createForm.email ?? ""} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Phone</label>
              <Input value={createForm.phone ?? ""} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Currency</label>
              <Input value={createForm.currency} onChange={(e) => setCreateForm({ ...createForm, currency: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Time Zone</label>
              <Input value={createForm.timeZone} onChange={(e) => setCreateForm({ ...createForm, timeZone: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Description</label>
            <Textarea value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} rows={3} />
          </div>
          {createError && <p className="text-sm text-red-500">{createError}</p>}
        </form>
      </Dialog>
    </div>
  );
}
