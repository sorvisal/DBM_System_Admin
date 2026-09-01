"use client";

import { useEffect, useState } from "react";
import { getUser } from "@/lib/api/users";
import type { AdminUserDto } from "@/lib/types";
import { esc, fmtDate } from "@/components/ui";
import { useModal, type ModalRecord, registerModalSlot } from "@/components/ui/Modal";
import { X } from "lucide-react";

function UserModal({ data }: { data: ModalRecord }) {
  const { close } = useModal();
  const id = typeof data.id === "number" ? data.id : null;
  const [user, setUser] = useState<AdminUserDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    getUser(id)
      .then((r) => setUser(r.data ?? null))
      .catch((err) => setError(err instanceof Error ? err.message : "Load failed"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="empty" style={{ padding: 24 }}>Loading…</p>;
  if (error) return <p className="login-error" style={{ padding: 24 }}>{error}</p>;
  if (!user) return <p className="empty" style={{ padding: 24 }}>User not found</p>;

  const roleBadge = (role: string) => {
    const color = role === "superadmin" ? "var(--danger)" : role === "admin" ? "var(--accent)" : "var(--text-muted)";
    return <span style={{ fontSize: 11, fontWeight: 600, color }}>{role.toUpperCase()}</span>;
  };

  return (
    <div>
      <div className="modal-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div className="modal-eyebrow">User</div>
          <div className="modal-title">{esc(user.fullName)}</div>
          <div className="modal-sub">{esc(user.username)}</div>
        </div>
        <button type="button" onClick={close} className="modal-close" style={{ position: "relative", top: 0, right: 0, border: "none", background: "none", padding: 4, cursor: "pointer", color: "var(--text-muted)" }} aria-label="Close">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="modal-body">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontSize: 13 }}>
          <div>
            <div style={{ color: "var(--text-muted)", fontSize: 11, marginBottom: 2 }}>Role</div>
            <div>{roleBadge(user.role)}</div>
          </div>
          <div>
            <div style={{ color: "var(--text-muted)", fontSize: 11, marginBottom: 2 }}>Status</div>
            <div style={{ color: user.isActive ? "var(--success)" : "var(--danger)", fontWeight: 600 }}>
              {user.isActive ? "Active" : "Inactive"}
            </div>
          </div>
          <div>
            <div style={{ color: "var(--text-muted)", fontSize: 11, marginBottom: 2 }}>Email</div>
            <div>{esc(user.email ?? "—")}</div>
          </div>
          <div>
            <div style={{ color: "var(--text-muted)", fontSize: 11, marginBottom: 2 }}>Phone</div>
            <div className="mono">{esc(user.phone ?? "—")}</div>
          </div>
          <div>
            <div style={{ color: "var(--text-muted)", fontSize: 11, marginBottom: 2 }}>Store</div>
            <div>{esc(user.storeName ?? "—")}</div>
          </div>
          <div>
            <div style={{ color: "var(--text-muted)", fontSize: 11, marginBottom: 2 }}>Created</div>
            <div>{fmtDate(user.createdAt)}</div>
          </div>
          {user.isGoogleLinked && (
            <div style={{ gridColumn: "1 / -1", fontSize: 12, color: "var(--success)" }}>
              Google account linked
            </div>
          )}
        </div>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-ghost" onClick={close}>Close</button>
      </div>
    </div>
  );
}

let registered = false;
if (typeof window !== "undefined" && !registered) {
  registered = true;
  registerModalSlot("user", (data: ModalRecord) => <UserModal data={data} />);
}

export { UserModal };
export default UserModal;
