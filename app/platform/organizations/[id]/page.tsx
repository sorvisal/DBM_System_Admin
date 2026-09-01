"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { apiGet, apiPost } from "@/lib/api/client";
import type { OrganizationDto } from "@/lib/types/organization";
import type { AdminUserDto, AdminCreateUserRequest } from "@/lib/types/user";
import type { DepotDto } from "@/lib/types/depot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/toast";
import { esc, fmtDate, generatePassword } from "@/components/ui";
import {
  ArrowLeft, Building2, Users, MapPin, Plus,
  Loader2, AlertCircle, Shield, UserPlus,
} from "lucide-react";
import { useRequireSuperAdmin } from "@/lib/platform";

export default function PlatformOrganizationPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const isSuperAdmin = useRequireSuperAdmin();
  const orgId = parseInt(params.id as string);

  const [org, setOrg] = useState<OrganizationDto | null>(null);
  const [depots, setDepots] = useState<DepotDto[]>([]);
  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreateUser, setShowCreateUser] = useState(false);
  const [createUserForm, setCreateUserForm] = useState<AdminCreateUserRequest>({
    username: "", password: generatePassword(), fullName: "", email: "", phone: "", storeName: "", role: "admin",
  });
  const [createUserBusy, setCreateUserBusy] = useState(false);
  const [createUserError, setCreateUserError] = useState("");

  useEffect(() => {
    if (!isSuperAdmin || isNaN(orgId)) return;
    setLoading(true);
    Promise.all([
      apiGet<OrganizationDto>(`/platform/organizations/${orgId}`),
      apiGet<DepotDto[]>(`/organizations/${orgId}/depots`),
      apiGet<AdminUserDto[]>(`/organizations/${orgId}/users`),
    ])
      .then(([o, d, u]) => {
        if (o.success) setOrg(o.data ?? null);
        if (d.success) setDepots(d.data ?? []);
        if (u.success) setUsers(u.data ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [isSuperAdmin, orgId]);

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    if (isNaN(orgId)) return;
    setCreateUserError("");
    if (!createUserForm.fullName.trim() || !createUserForm.email?.trim()) {
      setCreateUserError("Full name and email are required");
      return;
    }
    setCreateUserBusy(true);
    try {
      const res = await apiPost<any>(`/platform/organizations/${orgId}/admins`, {
        fullName: createUserForm.fullName.trim(),
        email: createUserForm.email.trim(),
        phone: createUserForm.phone?.trim() || null,
        role: createUserForm.role,
        depotId: null,
      });
      if (res.success) {
        toast("Admin created", "ok");
        setShowCreateUser(false);
        setCreateUserForm({ username: "", password: generatePassword(), fullName: "", email: "", phone: "", storeName: "", role: "admin" });
        const u = await apiGet<AdminUserDto[]>(`/organizations/${orgId}/users`);
        if (u.success) setUsers(u.data ?? []);
      } else {
        setCreateUserError(res.error || "Failed to create");
      }
    } catch (err) {
      setCreateUserError(err instanceof Error ? err.message : "Failed");
    } finally {
      setCreateUserBusy(false);
    }
  }

  async function toggleStatus(status: string) {
    if (isNaN(orgId)) return;
    try {
      await apiPost<boolean>(`/platform/organizations/${orgId}/${status === "suspended" ? "suspend" : "activate"}`);
      toast(`Organization ${status}d`, "ok");
      const o = await apiGet<OrganizationDto>(`/platform/organizations/${orgId}`);
      if (o.success) setOrg(o.data ?? null);
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
            <Building2 size={20} className="text-blue-600" />
            {org ? esc(org.name || "") : "Organization"}
          </h1>
          {org && <p className="text-sm text-slate-500 dark:text-slate-400">@{esc(org.slug || "")}</p>}
        </div>
        {org && org.status && (
          <Badge variant={org.status === "Active" ? "ok" : org.status === "Suspended" ? "warn" : "default"} className="ml-auto">
            {org.status}
          </Badge>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <span key={i} className="block h-32 w-full rounded-lg bg-slate-200 dark:bg-slate-800" />)}
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-red-500 py-8">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      ) : org ? (
        <div className="space-y-6">
          {/* Org info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Organization Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Name:</span>
                  <p className="font-medium">{esc(org.name || "")}</p>
                </div>
                <div>
                  <span className="text-slate-500">Slug:</span>
                  <p className="font-mono text-xs">{esc(org.slug || "")}</p>
                </div>
                <div>
                  <span className="text-slate-500">Email:</span>
                  <p>{esc(org.email || "—")}</p>
                </div>
                <div>
                  <span className="text-slate-500">Phone:</span>
                  <p>{esc(org.phone || "—")}</p>
                </div>
                <div>
                  <span className="text-slate-500">Currency:</span>
                  <p>{esc(org.currency || "USD")}</p>
                </div>
                <div>
                  <span className="text-slate-500">Time Zone:</span>
                  <p>{esc(org.timeZone || "UTC")}</p>
                </div>
                <div>
                  <span className="text-slate-500">Created:</span>
                  <p>{fmtDate(org.createdAt)}</p>
                </div>
                <div>
                  <span className="text-slate-500">Depots:</span>
                  <p>{depots.length}</p>
                </div>
              </div>
              {org.description && (
                <div className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                  {esc(org.description)}
                </div>
              )}
              <div className="mt-4 flex gap-2">
                {org.status !== "Suspended" && (
                  <Button variant="outline" size="sm" className="text-amber-600 hover:text-amber-700" onClick={() => toggleStatus("suspended")}>
                    Suspend
                  </Button>
                )}
                {org.status === "Suspended" && (
                  <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700" onClick={() => toggleStatus("activate")}>
                    Activate
                  </Button>
                )}
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={async () => {
                  if (!confirm(`Delete ${org.name}? This cannot be undone.`)) return;
                  await apiPost<boolean>(`/platform/organizations/${orgId}/delete`);
                  toast("Organization deleted", "ok");
                  router.push("/platform");
                }}>
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Depots */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <MapPin size={14} />
                Depots ({depots.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {depots.length === 0 ? (
                <div className="text-center py-6 text-sm text-slate-400">No depots yet</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Default</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {depots.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{esc(d.name)}</TableCell>
                        <TableCell className="font-mono text-xs">{esc(d.code)}</TableCell>
                        <TableCell>
                          <Badge variant={d.isActive ? "ok" : "default"}>{d.isActive ? "Active" : "Inactive"}</Badge>
                        </TableCell>
                        <TableCell>{d.isDefault ? "Yes" : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Users */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm"><Users size={14} /> Users ({users.length})</span>
                <Button size="sm" onClick={() => setShowCreateUser(true)}>
                  <UserPlus size={13} /> Add Admin
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <div className="text-center py-6 text-sm text-slate-400">No users yet. Create an admin to get started.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{esc(u.fullName)}</TableCell>
                        <TableCell className="font-mono text-xs">{esc(u.email || "—")}</TableCell>
                        <TableCell>
                          <Badge variant={u.role === "admin" ? "default" : "secondary"}>{u.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={u.isActive ? "ok" : "warn"}>{u.isActive ? "Active" : "Disabled"}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-400">{fmtDate(u.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Create Admin Dialog */}
      <Dialog
        open={showCreateUser} onOpenChange={setShowCreateUser}
        title="Create Organization Admin" description="Add an admin account for this organization."
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCreateUser(false)} disabled={createUserBusy}>Cancel</Button>
            <Button onClick={(e) => (document.getElementById("create-admin-form") as HTMLFormElement)?.requestSubmit()} disabled={createUserBusy}>
              {createUserBusy ? "Creating…" : "Create"}
            </Button>
          </>
        }
      >
        <form id="create-admin-form" onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Full Name *</label>
              <Input required value={createUserForm.fullName} onChange={(e) => setCreateUserForm({ ...createUserForm, fullName: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Email *</label>
              <Input type="email" required value={createUserForm.email ?? ""} onChange={(e) => setCreateUserForm({ ...createUserForm, email: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Phone</label>
            <Input value={createUserForm.phone ?? ""} onChange={(e) => setCreateUserForm({ ...createUserForm, phone: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Role</label>
            <select
              value={createUserForm.role}
              onChange={(e) => setCreateUserForm({ ...createUserForm, role: e.target.value as any })}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
            >
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="staff">Staff</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Password</label>
            <Input value={createUserForm.password} onChange={(e) => setCreateUserForm({ ...createUserForm, password: e.target.value })} />
            <p className="text-xs text-slate-400 mt-1">Auto-generated. Share securely with the admin.</p>
          </div>
          {createUserError && <p className="text-sm text-red-500">{createUserError}</p>}
        </form>
      </Dialog>
    </div>
  );
}
