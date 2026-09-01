"use client";

import { useRouter } from "next/navigation";
import { usePortal } from "../portal-context";
import { LogOut, Phone, Mail, History, ShieldCheck } from "lucide-react";
import { uploadsUrl } from "@/lib/api/client";

export default function AccountPage() {
  const { token, session, signOut } = usePortal();
  const router = useRouter();
  const base = `/order/${token}`;

  if (!session) return null;

  const c = session.customer;
  const initials = c.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="mx-auto max-w-2xl pb-20 md:pb-6">
      {/* Profile card */}
      <div className="rounded-2xl sm:rounded-3xl border border-[#e2eaf6] bg-white px-4 py-5 text-center shadow-[0_8px_24px_rgba(31,77,137,.08)] sm:p-6">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-to-b from-[#e6f2ff] to-[#dcecff] text-2xl font-black text-[#0b5af0] sm:h-24 sm:w-24 sm:text-3xl">
          {c.phone || c.email
            ? initials
            : <span className="text-3xl sm:text-4xl">👤</span>}
        </div>
        <h1 className="mt-2.5 text-lg font-extrabold sm:text-xl">{c.name}</h1>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 sm:text-xs">Verified customer</p>

        <div className="mt-3 space-y-1 text-sm sm:mt-4">
          {c.phone && (
            <div className="flex items-center justify-center gap-1.5 text-[#4c6480]"><Phone size={14} /> {c.phone}</div>
          )}
          {c.email && (
            <div className="flex items-center justify-center gap-1.5 text-[#4c6480]"><Mail size={14} /> {c.email}</div>
          )}
        </div>
      </div>

      {/* Menu */}
      <div className="mt-3 space-y-2 sm:mt-4">
        <MenuRow icon={<History size={16} />} label="Purchase history" hint="All your orders"
          onClick={() => router.push(`${base}/orders`)} />
        <MenuRow icon={<ShieldCheck size={16} />} label="Ordering via secure link" hint={`Link /order/${token}`}
          onClick={() => router.push(`${base}/home`)} />
      </div>

      <button onClick={() => { signOut(); router.replace(base); }}
        className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[#fdebec] bg-white font-bold text-sm text-[#bd3944] hover:bg-red-50 sm:mt-4 sm:h-12">
        <LogOut size={15} /> Sign Out
      </button>

      <p className="mt-3 text-center text-[10px] leading-relaxed text-slate-400 sm:mt-4 sm:text-xs">
        Your cart, account and orders are private to you.<br />
        Products and pricing are managed by the store.
      </p>
    </div>
  );
}

function MenuRow({
  icon, label, hint, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl border border-[#e2eaf6] bg-white px-4 py-3.5 text-left transition-shadow hover:shadow-md">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#eaf3ff] text-[#0d63ff]">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold">{label}</span>
        <span className="block truncate text-xs text-[#71829a]">{hint}</span>
      </span>
      <span className="text-slate-300">›</span>
    </button>
  );
}
