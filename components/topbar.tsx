"use client";

import { useEffect, useState, useRef } from "react";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { useNotifications } from "@/lib/notifications";
import { listNotifications, markAllNotificationsRead, getUnreadCount, deleteNotification } from "@/lib/api/notifications";
import { uploadsUrl } from "@/lib/api";
import { Search, Sun, Moon, Bell, Trash2 } from "lucide-react";
import type { NotificationDto } from "@/lib/types";
import { Avatar } from "@/components/ui/avatar";

export default function TopBar() {
  const [lang, setLang] = useState<"en" | "km">("en");
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifs, setNotifs] = useState<NotificationDto[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = (localStorage.getItem("dbm_lang") as "en" | "km") || "en";
    setLang(saved);
    document.documentElement.classList.toggle("km", saved === "km");
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.classList.toggle("light", theme === "light");
  }, [theme]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    getUnreadCount()
      .then((json) => { if (json.success && json.data != null) setUnreadCount(json.data); })
      .catch(() => {});
    listNotifications(true)
      .then((json) => { setNotifs(json.data ?? []); })
      .catch(() => {});
  }, []);

  const onNotification = (n: NotificationDto) => {
    setNotifs((prev) => [n, ...prev]);
    setUnreadCount((c) => c + 1);
  };
  const onUnreadCountChanged = (count: number) => setUnreadCount(count);
  useNotifications({ onNotification, onUnreadCountChanged });

  async function handleDelete(id: number) {
    await deleteNotification(id);
    setNotifs((prev) => prev.filter((n) => n.id !== id));
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }

  function change(next: "en" | "km") {
    setLang(next);
    localStorage.setItem("dbm_lang", next);
    document.documentElement.classList.toggle("km", next === "km");
  }

  return (
    <header className="h-14 border-b flex items-center px-4 gap-3 flex-shrink-0" style={{
      borderColor: "var(--border)",
      backgroundColor: "var(--bg-secondary)",
    }}>
      {/* Search */}
      <div className="flex-1 max-w-sm relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={15} style={{ color: "var(--text-muted)" }} />
        <input
          type="text"
          placeholder="Search..."
          aria-label="Global search"
          className="w-full h-8 pl-9 pr-16 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:border-transparent"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--surface)",
            color: "var(--text-primary)",
            caretColor: "var(--accent)",
          }}
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] px-1.5 py-0.5 rounded border" style={{
          color: "var(--text-muted)",
          backgroundColor: "var(--surface-hover)",
          borderColor: "var(--border)",
        }}>
          ⌘K
        </span>
      </div>

      <div className="flex-1" />

      {/* Controls */}
      <div className="flex items-center gap-1.5">
        {/* Language toggle */}
        <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <button
            className={`px-2.5 py-1 text-xs font-medium transition-colors ${lang === "en" ? "bg-blue-600 text-white" : ""}`}
            style={lang !== "en" ? { backgroundColor: "transparent", color: "var(--text-muted)" } : undefined}
            onClick={() => change("en")}
          >
            EN
          </button>
          <button
            className={`px-2.5 py-1 text-xs font-medium transition-colors ${lang === "km" ? "bg-blue-600 text-white" : ""}`}
            style={lang !== "km" ? { backgroundColor: "transparent", color: "var(--text-muted)" } : undefined}
            onClick={() => change("km")}
          >
            KH
          </button>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="h-8 w-8 rounded-lg border flex items-center justify-center transition-colors"
          aria-label="Toggle theme"
          style={{
            borderColor: "var(--border)",
            color: "var(--text-muted)",
            backgroundColor: "transparent",
          }}
        >
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Notifications */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setShowNotifs((v) => !v)}
            className="h-8 w-8 rounded-lg border flex items-center justify-center transition-colors relative"
            aria-label="Notifications"
            style={{
              borderColor: "var(--border)",
              color: "var(--text-muted)",
              backgroundColor: "transparent",
            }}
          >
            <Bell size={15} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-10 w-80 rounded-xl shadow-lg z-50 overflow-hidden" style={{
              backgroundColor: "var(--bg-secondary)",
              borderColor: "var(--border)",
              boxShadow: "var(--shadow-lg)",
            }}>
              <div className="px-3 py-2.5 flex items-center justify-between" style={{
                borderColor: "var(--border)",
                borderBottom: "1px solid var(--border)",
              }}>
                <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs font-medium"
                    style={{ color: "var(--accent)" }}
                  >
                    Mark all read
                  </button>
                )}
              </div>
              {notifs.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>No notifications</div>
              ) : (
                <div className="max-h-80 overflow-y-auto">
                  {notifs.slice(0, 10).map((n) => (
                    <div
                      key={n.id}
                      className="px-3 py-2.5 flex items-start gap-2"
                      style={{
                        borderBottom: "1px solid var(--border-light)",
                        backgroundColor: !n.isRead ? "var(--accent-soft)" : undefined,
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm" style={{ color: n.isRead ? "var(--text-muted)" : "var(--text-primary)", fontWeight: !n.isRead ? 600 : 400 }}>
                          {n.title}
                        </div>
                        <div className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>{n.body}</div>
                      </div>
                      <button
                        onClick={() => handleDelete(n.id)}
                        className="transition-colors flex-shrink-0"
                        style={{ color: "var(--text-muted)" }}
                        aria-label="Delete notification"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* User avatar */}
        <Avatar
          src={user?.photoPath ? uploadsUrl(user.photoPath) : undefined}
          fallback={user?.fullName?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "U"}
          className="w-8 h-8 text-xs cursor-pointer"
        />
      </div>
    </header>
  );
}
