"use client";

import { useEffect, useState, type FormEvent } from "react";
import { listUsers, createUser, updateUser, deleteUser, resetUserPassword } from "@/lib/api/users";
import type { AdminUserDto, AdminCreateUserRequest, AdminUpdateUserRequest, UserRole } from "@/lib/types";
import { uploadsUrl } from "@/lib/api";
import { ROLE_CAN_CREATE } from "@/lib/types";
import { esc, fmtDate, generatePassword, initials } from "@/components/ui";
import { useToast } from "@/components/toast";
import { useAuth } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/ui/avatar";
import { Plus, Search, Filter, Key } from "lucide-react";

export default function UsersPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [rows, setRows] = useState<AdminUserDto[]>([]);
  const [meta, setMeta] = useState<{ page: number; pageSize: number; total: number; totalPages: number } | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [active, setActive] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<AdminCreateUserRequest>({
    username: "", password: "", fullName: "", email: "", phone: "", storeName: "", role: "staff",
  });
  const [createPhoto, setCreatePhoto] = useState<File | null>(null);
  const [createPhotoPreview, setCreatePhotoPreview] = useState<string | null>(null);
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const [createBusy, setCreateBusy] = useState(false);

  const [pwTarget, setPwTarget] = useState<AdminUserDto | null>(null);
  const [pwValue, setPwValue] = useState("");
  const [pwBusy, setPwBusy] = useState(false);

  const [showEdit, setShowEdit] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminUserDto | null>(null);
  const [editForm, setEditForm] = useState<AdminUpdateUserRequest>({ fullName: "", email: "", phone: "", storeName: "", role: "staff" });
  const [editPhoto, setEditPhoto] = useState<File | null>(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null);
  const [editBusy, setEditBusy] = useState(false);

  const [showDelete, setShowDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminUserDto | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const json = await listUsers({ page, pageSize: 20, search: search || undefined, role: role || undefined, active: active || undefined });
      setRows(json.data ?? []);
      setMeta(json.meta ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [page, search, role, active]);

  if (user?.role !== "superadmin") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Access Denied</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Only superadmin accounts can access user management.</p>
        </div>
        <Card>
          <CardContent className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Logged in as <strong className="text-slate-700 dark:text-slate-300">{esc(user?.role || "—")}</strong>. This page is restricted to superadmins.
          </CardContent>
        </Card>
      </div>
    );
  }

  const pages = meta?.totalPages ?? 1;
  const allowedCreateRoles: UserRole[] = ROLE_CAN_CREATE[user?.role ?? "user"] ?? [];

  async function createUserHandler(e: FormEvent) {
    e.preventDefault();
    setCreateErrors({});
    setCreateBusy(true);
    try {
      await createUser({ ...createForm, photo: createPhoto ? await (await import("@/lib/api")).fileToBase64(createPhoto) : null });
      setShowCreate(false);
      toast("User created", "ok");
      load();
    } catch (err) {
      if (err instanceof Error && (err as { status?: number }).status === 422) {
        const fieldErrors = (err as { fieldErrors?: Record<string, string> }).fieldErrors ?? {};
        setCreateErrors(fieldErrors);
        toast(Object.values(fieldErrors)[0] ?? "Validation failed", "err");
      } else {
        toast(err instanceof Error ? err.message : "Create failed", "err");
      }
    } finally {
      setCreateBusy(false);
    }
  }

  function openPw(u: AdminUserDto) {
    setPwTarget(u);
    setPwValue(generatePassword());
  }

  async function doResetPassword() {
    if (!pwTarget) return;
    if (pwValue.length < 8) { toast("Password must be at least 8 characters", "err"); return; }
    const strengthRe = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
    if (!strengthRe.test(pwValue)) { toast("Password must contain uppercase, lowercase, and a number", "err"); return; }
    setPwBusy(true);
    try {
      await resetUserPassword(pwTarget.id, { newPassword: pwValue });
      const name = esc(pwTarget.fullName);
      setPwTarget(null);
      load();
      toast(`Password updated for ${name}`, "ok");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Reset failed", "err");
    } finally {
      setPwBusy(false);
    }
  }

  function resetPw(e: FormEvent) {
    e.preventDefault();
    doResetPassword();
  }

  async function toggleActive(u: AdminUserDto) {
    try {
      await updateUser(u.id, { isActive: !u.isActive });
      toast(`${u.fullName} ${u.isActive ? "disabled" : "enabled"}`, "ok");
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Update failed", "err");
    }
  }

  function openEdit(u: AdminUserDto) {
    setEditTarget(u);
    setEditForm({ fullName: u.fullName, email: u.email, phone: u.phone, storeName: u.storeName, role: u.role });
    setEditPhoto(null);
    setEditPhotoPreview(u.photoPath ? uploadsUrl(u.photoPath) : null);
    setShowEdit(true);
  }

  async function updateUserHandler(e: FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    if (!editForm.fullName?.trim()) { toast("Full name is required", "err"); return; }
    setEditBusy(true);
    try {
      await updateUser(editTarget.id, {
        fullName: editForm.fullName?.trim() || null, email: editForm.email?.trim() || null,
        phone: editForm.phone?.trim() || null, storeName: editForm.storeName?.trim() || null,
        role: editForm.role, photo: editPhoto ? await (await import("@/lib/api")).fileToBase64(editPhoto) : null,
      });
      setShowEdit(false);
      toast("User updated", "ok");
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Update failed", "err");
    } finally { setEditBusy(false); }
  }

  function openDelete(u: AdminUserDto) { setDeleteTarget(u); setShowDelete(true); }

  async function deleteUserHandler(u: AdminUserDto) {
    setDeleteBusy(true);
    try {
      await deleteUser(u.id);
      setShowDelete(false);
      toast(`Deleted ${u.fullName}`, "ok");
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Delete failed", "err");
    } finally { setDeleteBusy(false); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Users</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage accounts and permissions.</p>
        </div>
        <Button onClick={() => {
          setCreateForm({ username: "", password: generatePassword(), fullName: "", email: "", phone: "", storeName: "", role: "staff" });
          setCreatePhoto(null); setCreatePhotoPreview(null); setShowCreate(true);
        }}>
          <Plus size={15} />
          Create User
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
              <Input placeholder="Search name / email…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
            </div>
            <Select value={role} onChange={(v) => { setRole(v); setPage(1); }} className="w-36">
              <option value="">All roles</option>
              <option value="superadmin">superadmin</option>
              <option value="admin">admin</option>
              <option value="staff">staff</option>
              <option value="user">user</option>
            </Select>
            <Select value={active} onChange={(v) => { setActive(v); setPage(1); }} className="w-32">
              <option value="">All status</option>
              <option value="true">Active</option>
              <option value="false">Disabled</option>
            </Select>
            {(search || role || active) && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setRole(""); setActive(""); setPage(1); }}>Clear</Button>
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
            <div className="flex flex-col items-center justify-center py-12 text-sm text-slate-400 dark:text-slate-500 gap-2">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-30"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
              <span>No users found</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar fallback={initials(u.fullName)} className="w-7 h-7 text-xs" src={u.photoPath ? uploadsUrl(u.photoPath) : undefined} />
                        <div>
                          <div className="font-medium text-sm">{esc(u.fullName)}</div>
                          <div className="text-xs text-slate-400 mono">@{esc(u.username)}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{esc(u.email || "—")}</div>
                      <div className="text-xs text-slate-400 mono">{esc(u.phone || "")}</div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${u.role === "superadmin" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" : u.role === "admin" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>
                        {u.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${u.isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`}>
                        {u.isActive ? "Active" : "Disabled"}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">{fmtDate(u.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 flex-wrap">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(u)}>Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => openPw(u)} title="Reset password"><Key size={13} /></Button>
                        <Button variant="ghost" size="sm" className={u.isActive ? "text-red-500" : "text-emerald-500"} onClick={() => toggleActive(u)}>
                          {u.isActive ? "Disable" : "Enable"}
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => openDelete(u)}>Delete</Button>
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
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800">‹ Prev</button>
            <span>Page {page} of {pages}</span>
            <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page >= pages} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800">Next ›</button>
          </div>
        )}
      </Card>

      {/* Create */}
      <Dialog
        open={showCreate} onOpenChange={setShowCreate} title="Create User" description="Add a new account."
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCreate(false)} disabled={createBusy}>Cancel</Button>
            <Button onClick={(e) => (document.getElementById("create-user-form") as HTMLFormElement)?.requestSubmit()} disabled={createBusy}>{createBusy ? "Creating…" : "Create"}</Button>
          </>
        }
      >
        <form id="create-user-form" onSubmit={createUserHandler} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Username</label>
              <Input required value={createForm.username} onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })} />
              {createErrors.username && <p className="text-xs text-red-500 mt-1">{esc(createErrors.username)}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Full name</label>
              <Input required value={createForm.fullName} onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })} />
              {createErrors.fullName && <p className="text-xs text-red-500 mt-1">{esc(createErrors.fullName)}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Email</label>
              <Input type="email" value={createForm.email ?? ""} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} />
              {createErrors.email && <p className="text-xs text-red-500 mt-1">{esc(createErrors.email)}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Role</label>
              <Select value={createForm.role} onChange={(v) => setCreateForm({ ...createForm, role: v as UserRole })}>
                {allowedCreateRoles.map((r) => <option key={r} value={r}>{r}</option>)}
              </Select>
              {createErrors.role && <p className="text-xs text-red-500 mt-1">{esc(createErrors.role)}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Phone</label>
              <Input value={createForm.phone ?? ""} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Store name</label>
              <Input value={createForm.storeName ?? ""} onChange={(e) => setCreateForm({ ...createForm, storeName: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Password</label>
            <Input value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} />
            <p className="text-xs text-slate-400 mt-1">Auto-generated. Change before sharing.</p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Photo</label>
            <Input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setCreatePhoto(f); setCreatePhotoPreview(URL.createObjectURL(f)); } }} className="text-sm" />
          </div>
          {createPhotoPreview && <img src={createPhotoPreview} alt="preview" className="w-12 h-12 rounded-full object-cover" />}
        </form>
      </Dialog>

      {/* Password reset */}
      <Dialog
        open={!!pwTarget} onOpenChange={(v) => { if (!v) setPwTarget(null); }}
        title="Reset Password" description={`Reset password for ${pwTarget ? esc(pwTarget.fullName) : ""}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPwTarget(null)} disabled={pwBusy}>Cancel</Button>
            <Button type="button" onClick={() => (document.getElementById("pw-form") as HTMLFormElement)?.requestSubmit()} disabled={pwBusy}>{pwBusy ? "Saving…" : "Save"}</Button>
          </>
        }
      >
        <form id="pw-form" onSubmit={resetPw} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">New password</label>
            <Input type="text" required value={pwValue} onChange={(e) => setPwValue(e.target.value)} />
            <p className="text-xs text-slate-400 mt-1">At least 8 chars, uppercase, lowercase, and a number.</p>
          </div>
        </form>
      </Dialog>

      {/* Edit */}
      <Dialog
        open={showEdit} onOpenChange={setShowEdit} title="Edit User" description={editTarget ? esc(editTarget.fullName) : ""}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowEdit(false)} disabled={editBusy}>Cancel</Button>
            <Button onClick={(e) => (document.getElementById("edit-user-form") as HTMLFormElement)?.requestSubmit()} disabled={editBusy}>{editBusy ? "Saving…" : "Save"}</Button>
          </>
        }
      >
        {editTarget && (
          <form id="edit-user-form" onSubmit={updateUserHandler} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Full name</label>
                <Input required value={editForm.fullName || ""} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Username</label>
                <Input disabled value={`@${editTarget.username}`} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Email</label>
              <Input type="email" value={editForm.email ?? ""} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Phone</label>
                <Input value={editForm.phone ?? ""} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Store name</label>
                <Input value={editForm.storeName ?? ""} onChange={(e) => setEditForm({ ...editForm, storeName: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Role</label>
              <Select value={editForm.role || "staff"} onChange={(v) => setEditForm({ ...editForm, role: v as UserRole })}>
                <option value="staff">staff</option>
                <option value="admin">admin</option>
                <option value="user">user</option>
                <option value="superadmin">superadmin</option>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Photo</label>
              <Input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setEditPhoto(f); setEditPhotoPreview(URL.createObjectURL(f)); } }} className="text-sm" />
            </div>
            {editPhotoPreview && <img src={editPhotoPreview} alt="preview" className="w-12 h-12 rounded-full object-cover" />}
          </form>
        )}
      </Dialog>

      {/* Delete confirm */}
      <Dialog
        open={showDelete} onOpenChange={setShowDelete}
        title="Delete User" description={deleteTarget ? `Permanently delete ${deleteTarget.fullName}?` : ""}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowDelete(false)} disabled={deleteBusy}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteTarget && deleteUserHandler(deleteTarget)} disabled={deleteBusy}>{deleteBusy ? "Deleting…" : "Delete"}</Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-400">This action cannot be undone. The account and all associated data will be permanently removed.</p>
      </Dialog>
    </div>
  );
}
