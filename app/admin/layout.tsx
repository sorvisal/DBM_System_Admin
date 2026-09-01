"use client";

import { useState } from "react";
import Sidebar from "@/components/sidebar";
import TopBar from "@/components/topbar";
import AuthGate from "@/components/AuthGate";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <AuthGate>
      <div className="app-shell">
        <Sidebar open={open} onClose={() => setOpen(false)} onToggle={() => setOpen((v) => !v)} />
        <div className="main-workspace">
          <TopBar />
          <main className="content-area">
            {children}
          </main>
        </div>
      </div>
    </AuthGate>
  );
}
