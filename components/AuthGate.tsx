"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/types";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if ((pathname?.startsWith("/admin/users") || pathname?.startsWith("/admin/management/organizations")) && !isSuperAdmin(user.role)) {
      router.replace("/admin");
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return <p className="empty">Loading session…</p>;
  }
  if (!user) return null;
  return <>{children}</>;
}
