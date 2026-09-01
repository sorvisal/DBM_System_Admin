// ---------- helpers ----------
export function esc(s: unknown): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) => {
    switch (c) {
      case "&": return "&";
      case "<": return "<";
      case ">": return ">";
      case '"': return '"';
      case "'": return "'";
      default: return c;
    }
  });
}

export function fmtMoney(n: unknown): string {
  return (
    "$" +
    Number(n ?? 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

export function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function fmtDateTime(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function initials(name: string): string {
  return String(name || "?")
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function roleBadge(role: string) {
  const variant = role === "admin" ? "amber" : role === "staff" ? "ok" : "muted";
  return <Badge variant={variant}>{esc(role)}</Badge>;
}

export function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
  let out = "";
  for (let i = 0; i < 12; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

// ---------- components ----------
export function StatCard({
  label,
  value,
  hint,
  cls = "",
  cornerIcon,
  delta,
  deltaDown = false,
}: {
  label: string;
  value: string | number;
  hint?: string;
  cls?: string;
  cornerIcon?: React.ReactNode;
  delta?: string;
  deltaDown?: boolean;
}) {
  return (
    <div className={`stat-card ${cls}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {hint && <div className="stat-hint">{hint}</div>}
      {cornerIcon && <div className="stat-corner">{cornerIcon}</div>}
      {delta && (
        <div className={`stat-delta ${deltaDown ? "delta-down" : "delta-up"}`}>
          {delta}
        </div>
      )}
    </div>
  );
}

// Badge component (simplified)
export function Badge({
  variant,
  children,
}: {
  variant: "default" | "muted" | "ok" | "warn" | "error" | "amber";
  children: React.ReactNode;
}) {
  return (
    <span
      className={`badge badge-${variant}`}
      role="status"
      aria-live="polite"
    >
      {children}
    </span>
  );
}

// Field component (input wrapper)
export function Field({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  error,
  children,
}: {
  label: string;
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="field">
      <label className="field-label">
        {label}
        {required && <span className="field-required">*</span>}
      </label>
      <div className="field-input-wrapper">
        {children}
      </div>
      {error && <div className="field-error">{error}</div>}
    </div>
  );
}

// Modal component (simplified)
export function Modal({
  children,
  onClose,
  isOpen = true,
  eyebrow,
  title,
  sub,
  footer,
}: {
  children: React.ReactNode;
  onClose: () => void;
  isOpen?: boolean;
  eyebrow?: string;
  title?: string;
  sub?: string;
  footer?: React.ReactNode;
}) {
  if (!isOpen) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          {eyebrow && <div className="modal-eyebrow">{eyebrow}</div>}
          {title && <div className="modal-title">{title}</div>}
          {sub && <div className="modal-sub">{sub}</div>}
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// Pager component (simplified)
export function Pager({
  page,
  pages,
  onPrev,
  onNext,
}: {
  page: number;
  pages: number;
  total?: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (pages <= 1) return null;
  return (
    <nav className="pager" aria-label="Pagination">
      <button
        className={`pager-button ${page === 1 ? "disabled" : ""}`}
        onClick={onPrev}
        disabled={page === 1}
      >
        ‹
      </button>
      <span className="pager-info">
        Page {page} of {pages}
      </span>
      <button
        className={`pager-button ${page === pages ? "disabled" : ""}`}
        onClick={onNext}
        disabled={page === pages}
      >
        ›
      </button>
    </nav>
  );
}
