import type { NotificationDto } from "@/lib/types";
import { apiDelete, apiGet, apiPut } from "./client";

export function listNotifications(unread = false) {
  return apiGet<NotificationDto[]>("/notifications" + (unread ? "?unread=true" : ""));
}

export function getUnreadCount() {
  return apiGet<number>("/notifications/count?unread=true");
}

export function markNotificationRead(id: number) {
  return apiPut<boolean>(`/notifications/${id}/read`);
}

export function markAllNotificationsRead() {
  return apiPut<boolean>("/notifications/read-all");
}

export function deleteNotification(id: number) {
  return apiDelete<boolean>(`/notifications/${id}`);
}
