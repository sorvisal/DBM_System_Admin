export interface NotificationDto {
  id: number;
  userId: number | null;
  title: string | null;
  body: string | null;
  description: string | null;
  isRead: boolean;
  createdAt: string;
}

/** Payload from OrdersHub / NotificationsHub LowStockAlert event. */
export interface LowStockAlertPayload {
  productId: number;
  name: string;
  stockQty: number;
  lowStockThreshold: number;
}

