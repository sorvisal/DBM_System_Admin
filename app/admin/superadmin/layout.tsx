"use client";

import AuthGate from "@/components/AuthGate";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      {children}
    </AuthGate>
  );
}
