"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { getCurrentDepot, getDepots } from "@/lib/api/depots";
import type { DepotDto } from "@/lib/types/depot";
import { ChevronDown, Building2 } from "lucide-react";

const DEPOT_STORAGE_KEY = "dbm_current_depot";

export function useDepot() {
  const { user } = useAuth();
  const [currentDepot, setCurrentDepot] = useState<DepotDto | null>(null);
  const [availableDepots, setAvailableDepots] = useState<DepotDto[]>([]);
  const [isOrgWide, setIsOrgWide] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const orgId = user?.role === "superadmin" ? null : (user as any)?.organizationId ?? null;

  const load = useCallback(async () => {
    if (!user) return;
    if (user.role === "superadmin") { setLoading(false); return; }
    if (!orgId) { setLoading(false); return; }
    setLoading(true);
    setError("");
    try {
      const [current, all] = await Promise.all([
        getCurrentDepot(orgId),
        getDepots(orgId),
      ]);
      if (current.success) {
        setAvailableDepots(current.data?.availableDepots ?? []);
        setIsOrgWide(current.data?.isOrganizationWide ?? false);
        if (current.data?.currentDepot) {
          setCurrentDepot(current.data.currentDepot);
          localStorage.setItem(DEPOT_STORAGE_KEY, String(current.data.currentDepot.id));
        } else {
          const saved = localStorage.getItem(DEPOT_STORAGE_KEY);
          if (saved) {
            const savedDepot = (current.data?.availableDepots ?? []).find((d) => d.id === parseInt(saved));
            setCurrentDepot(savedDepot ?? null);
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load depots");
    } finally {
      setLoading(false);
    }
  }, [user, orgId]);

  useEffect(() => { load(); }, [load]);

  async function switchDepot(depotId: number) {
    localStorage.setItem(DEPOT_STORAGE_KEY, String(depotId));
    const depot = availableDepots.find((d) => d.id === depotId);
    if (depot) setCurrentDepot(depot);
  }

  return { currentDepot, availableDepots, isOrgWide, loading, error, switchDepot, reload: load };
}

export function DepotSwitcher({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth();
  const { currentDepot, availableDepots, isOrgWide, loading } = useDepot();

  if (user?.role === "superadmin") return null;
  if (loading || !currentDepot) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs" style={{ color: "var(--text-muted)", backgroundColor: "var(--surface-hover)" }}>
        <Building2 size={12} />
        <span className="font-medium">{currentDepot.name}</span>
      </div>
    );
  }

  return <DepotDropdown current={currentDepot} depots={availableDepots} isOrgWide={isOrgWide} />;
}

function DepotDropdown({
  current,
  depots,
  isOrgWide,
}: {
  current: DepotDto;
  depots: DepotDto[];
  isOrgWide: boolean;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
        style={{ color: "var(--text-primary)", borderColor: "var(--border)" }}
      >
        <Building2 size={14} className="text-slate-400" />
        <span className="max-w-32 truncate">{current.name}</span>
        <ChevronDown size={12} className="text-slate-400" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-56 rounded-xl shadow-lg z-50 overflow-hidden" style={{
          backgroundColor: "var(--bg-secondary)",
          borderColor: "var(--border)",
          boxShadow: "var(--shadow-lg)",
          border: "1px solid var(--border)",
        }}>
          <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>
            Select Depot
          </div>
          <div className="py-1">
            {depots.map((d) => (
              <button
                key={d.id}
                onClick={async () => {
                  const { useDepot: _ } = await import("@/components/DepotSwitcher");
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${d.id === current.id ? "bg-blue-600/10" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                style={d.id === current.id ? { color: "var(--accent)" } : { color: "var(--text-primary)" }}
              >
                <Building2 size={14} />
                <span className="flex-1 truncate">{d.name}</span>
                {d.isDefault && <span className="text-xs opacity-60">Default</span>}
              </button>
            ))}
            {isOrgWide && (
              <button
                onClick={() => setOpen(false)}
                className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                style={{ color: "var(--text-primary)" }}
              >
                <span className="text-xs">📊</span>
                <span className="flex-1">All Depots</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
