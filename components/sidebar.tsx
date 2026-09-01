"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard,
  Package,
  Tags,
  Truck,
  Users,
  Archive,
  ShoppingCart,
  FileText,
  Bell,
  Settings,
  LogOut,
  DollarSign,
  Building2,
  QrCode,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { getUnreadCount } from "@/lib/api/notifications";
import { useNotifications } from "@/lib/notifications";
import { getProductSummary } from "@/lib/api/products";
import { uploadsUrl } from "@/lib/api";
import { Avatar } from "@/components/ui/avatar";

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
  onToggle?: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: { count: number; color: string };
  roles?: string[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
  roles?: string[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Inventory",
    items: [
      { href: "/admin/inventory", label: "Inventory", icon: Archive },
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/categories", label: "Categories", icon: Tags },
      { href: "/admin/stock", label: "Stock Movements", icon: Archive },
    ],
  },
  {
    label: "Sales",
    items: [
      { href: "/admin/customers", label: "Customers", icon: Users },
      { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
      { href: "/admin/customer-orders", label: "Customer Orders", icon: QrCode },
    ],
  },
  {
    label: "Purchasing",
    items: [
      { href: "/admin/purchase-orders", label: "Purchase Orders", icon: FileText },
      { href: "/admin/suppliers", label: "Suppliers", icon: Truck },
    ],
  },
  {
    label: "Reports",
    items: [
      { href: "/admin/management/reports", label: "Revenue & Reports", icon: DollarSign },
      { href: "/admin/management/transactions", label: "Transactions", icon: FileText },
    ],
    roles: ["superadmin", "admin"],
  },
  {
    label: "System",
    items: [
      {
        href: "/admin/notifications",
        label: "Notifications",
        icon: Bell,
        badge: { count: 0, color: "var(--danger)" },
      },
      { href: "/admin/settings", label: "Settings", icon: Settings },
      { href: "/admin/users", label: "Users", icon: Users, roles: ["superadmin"] },
      { href: "/admin/management/organizations", label: "Organizations", icon: Building2, roles: ["superadmin"] },
    ],
  },
];

export default function Sidebar({ open, onClose, onToggle }: SidebarProps = {}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    getUnreadCount()
      .then((json) => { if (json.success && json.data != null) setUnreadCount(json.data); })
      .catch(() => {});
    getProductSummary()
      .then((json) => {
        if (json.success && json.data) setLowStockCount(json.data.lowStockCount ?? 0);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      getUnreadCount()
        .then((json) => { if (json.success && json.data != null) setUnreadCount(json.data); })
        .catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const onNotification = useCallback(() => {
    if (!pathname?.startsWith("/admin/notifications")) {
      setUnreadCount((c) => c + 1);
    }
  }, [pathname]);
  useNotifications({ onNotification, onUnreadCountChanged: setUnreadCount });

  async function handleLogout() {
    await logout();
    window.location.href = "/login";
  }

  function handleNavClick() {
    if (onClose) onClose();
  }

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin" || pathname === "/admin/";
    return pathname?.startsWith(href);
  }

  function getInitials(name: string) {
    return name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "A";
  }

  function shouldShow(item: { roles?: string[] }) {
    if (!item.roles) return true;
    return item.roles.includes(user?.role || "");
  }

  return (
    <>
      {onToggle && (
        <button
          type="button"
          className="fixed top-3 left-3 z-50 lg:hidden h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 flex items-center justify-center"
          onClick={onToggle}
          aria-label="Toggle sidebar"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      )}

      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={handleNavClick} />
      )}

      <aside className={`fixed lg:sticky top-0 left-0 h-screen z-40 flex flex-col bg-[var(--bg-secondary)] dark:bg-[var(--bg-secondary)] border-r border-[var(--border)] w-64 transition-transform duration-200 ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        {/* Logo */}
        <div className="px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <div>
              <div className="font-semibold text-sm tracking-tight" style={{ color: "var(--text-primary)" }}>DBM</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>Distribution Ops</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {NAV_GROUPS.map((group) => {
            if (group.roles && !group.roles.includes(user?.role || "")) return null;
            return (
              <div key={group.label} className="mb-3">
                <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  {group.label}
                </div>
                {group.items.map((item) => {
                  if (!shouldShow(item)) return null;
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  const unread = item.href === "/admin/notifications" ? unreadCount : 0;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleNavClick}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-0.5 ${
                        active
                          ? "bg-blue-600/15 text-blue-500"
                          : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
                      }`}
                    >
                      <Icon size={16} strokeWidth={2} className={active ? "text-blue-500" : ""} />
                      <span className="flex-1">{item.label}</span>
                      {unread > 0 && (
                        <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                          {unread}
                        </span>
                      )}
                      {item.href === "/admin/inventory" && lowStockCount > 0 && (
                        <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                          {lowStockCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="px-3 py-3 border-t border-[var(--border)]">
          <div className="flex items-center gap-2.5 mb-2">
            <Avatar
              src={user?.photoPath ? uploadsUrl(user.photoPath) : undefined}
              fallback={getInitials(user?.fullName || "")}
              className="w-8 h-8 text-xs"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                {user?.fullName || user?.username || "User"}
              </div>
              <div className="text-xs capitalize" style={{ color: "var(--text-muted)" }}>{user?.role || "—"}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
