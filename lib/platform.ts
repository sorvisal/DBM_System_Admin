"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { apiGet } from "@/lib/api/client";

export function usePlatform() {
  const { user } = useAuth();
  const router = useRouter();
  const [orgId, setOrgId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    if (user.role === "superadmin") { setOrgId(null); setLoading(false); return; }
    setLoading(true);
    apiGet<{ id: number }>("/organizations/me")
      .then((json) => {
        if (json.success && json.data) setOrgId(json.data.id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  return { orgId, loading };
}

export function useRequireSuperAdmin() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && user.role !== "superadmin") {
      router.replace("/admin");
    }
  }, [user, router]);

  return user?.role === "superadmin";
}
