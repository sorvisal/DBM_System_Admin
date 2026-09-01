export enum OrderStatus {
  Pending = "Pending",
  Approved = "Approved",
  Delivering = "Delivering",
  Confirmed = "Confirmed",
  Completed = "Completed",
  Cancelled = "Cancelled",
}

export interface OrderLineDto {
  productId: number;
  productName: string | null;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  stockBatchId: number | null;
  batchNumber: string | null;
  manufactureDate: string | null;
  expiryDate: string | null;
}

export interface OrderDto {
  id: number;
  code: string | null;
  customerId: number;
  customerName: string | null;
  status: string | null;
  paymentStatus: string | null;
  deliveryAddress: string | null;
  driverName: string | null;
  driverPhone: string | null;
  totalAmount: number;
  paidAmount: number;
  paymentMethod: string | null;
  createdAt: string;
  confirmedAt: string | null;
  completedAt: string | null;
  deliveryStartedAt: string | null;
  lines: OrderLineDto[] | null;
  description: string | null;
  approvedByUserId: number | null;
  approvedAt: string | null;
  approvedByName: string | null;
}

export interface OrderCreateLine {
  productId: number;
  qty: number;
  stockBatchId?: number | null;
}

export interface OrderCreateRequest {
  customerId: number;
  lines: OrderCreateLine[] | null;
  deliveryAddress: string | null;
  description: string | null;
}

export interface OrderUpdateRequest {
  customerId: number;
  lines: OrderCreateLine[] | null;
  deliveryAddress: string | null;
  description: string | null;
}

export interface OrderStatusRequest {
  status: string | null;
}

export interface AssignDriverRequest {
  driverName: string;
  driverPhone: string;
  deliveryAddress?: string | null;
}

export interface PaymentRequest {
  amount: number;
  method: string | null;
}

export interface OrderStatusChangedPayload {
  id: number;
  code: string;
  status: OrderStatus;
  updatedAt: string;
}
