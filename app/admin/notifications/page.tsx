"use client";

import { useEffect, useState, useCallback } from "react";
import type { NotificationDto } from "@/lib/types";
import { fmtDate } from "@/components/ui";
import { useToast } from "@/components/toast";
import { useNotifications } from "@/lib/notifications";
import { listNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification } from "@/lib/api/notifications";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Bell, Trash2 } from "lucide-react";

export default function NotificationsPage() {
  const { toast } = useToast();
  const [rows, setRows] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const json = await listNotifications();
      setRows(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const onNotification = useCallback((n: NotificationDto) => {
    setRows((prev) => [n, ...prev]);
    toast(n.title ?? "", "ok");
  }, [toast]);

  const onNotificationRead = useCallback((id: number) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, isRead: true } : r)));
  }, []);

  const onNotificationsReadAll = useCallback(() => {
    setRows((prev) => prev.map((r) => ({ ...r, isRead: true })));
  }, []);

  const onNotificationDeleted = useCallback((id: number) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }, []);

  useNotifications({ onNotification, onNotificationRead, onNotificationsReadAll, onNotificationDeleted });

  async function markRead(n: NotificationDto) {
    try {
      await markNotificationRead(n.id);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "err");
    }
  }

  async function markAllRead() {
    try {
      await markAllNotificationsRead();
      toast("All notifications marked as read", "ok");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "err");
    }
  }

  async function handleDelete(n: NotificationDto) {
    try {
      await deleteNotification(n.id);
      toast("Notification deleted", "ok");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "err");
    }
  }

  const unreadCount = rows.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Notifications</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCircle size={14} />
            Mark all read
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : error ? (
            <div className="p-4 text-sm text-red-500">{error}</div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-sm text-slate-400 dark:text-slate-500 gap-2">
              <Bell size={32} className="opacity-30" />
              <span>No notifications</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Notification</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((n) => (
                  <TableRow key={n.id} className={!n.isRead ? "bg-amber-50/50 dark:bg-amber-900/10" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {!n.isRead && <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />}
                        <div>
                          <div className={`text-sm font-medium ${n.isRead ? "text-slate-600 dark:text-slate-400" : "text-slate-900 dark:text-slate-100"}`}>
                            {n.title}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">{n.body}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${n.isRead ? "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`}>
                        {n.isRead ? "Read" : "Unread"}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">{fmtDate(n.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!n.isRead && (
                          <Button variant="ghost" size="sm" onClick={() => markRead(n)}>Mark read</Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(n)}
                          className="text-slate-400 hover:text-red-500"
                          aria-label="Delete notification"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

