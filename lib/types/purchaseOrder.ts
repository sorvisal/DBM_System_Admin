export enum PurchaseOrderStatus {
  Pending = "Pending",
  Confirmed = "Confirmed",
  Delivering = "Delivering",
  Completed = "Completed",
  Cancelled = "Cancelled",
}

export interface PurchaseLineDto {
  productId: number;
  productName: string | null;
  qty: number;
  unitCost: number;
  lineTotal: number;
  stockBatchId: number | null;
  batchNumber: string | null;
  manufactureDate: string | null;
  expiryDate: string | null;
}

export interface PurchaseOrderDto {
  id: number;
  code: string | null;
  supplierId: number;
  supplierName: string | null;
  status: string | null;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: string | null;
  paymentMethod: string | null;
  paidAt: string | null;
  createdAt: string;
  confirmedAt: string | null;
  completedAt: string | null;
  lines: PurchaseLineDto[] | null;
  description: string | null;
}

export interface PurchaseCreateLine {
  productId: number;
  qty: number;
  stockBatchId?: number | null;
  batchNumber?: string | null;
  manufactureDate?: string | null;
  expiryDate?: string | null;
}

export interface PurchaseCreateRequest {
  supplierId: number;
  lines: PurchaseCreateLine[] | null;
  description: string | null;
}

export interface PurchaseStatusRequest {
  status: string | null;
}

export interface PurchasePaymentRequest {
  amount: number;
  method: string | null;
}

export interface StockBatchDto {
  id: number;
  productId: number;
  productName: string;
  batchNumber: string | null;
  manufactureDate: string | null;
  expiryDate: string | null;
  quantity: number;
  unitCost: number;
  createdAt: string;
  updatedAt: string;
}

export interface StockBatchSummaryDto {
  id: number;
  productId: number;
  productName: string;
  batchNumber: string | null;
  manufactureDate: string | null;
  expiryDate: string | null;
  availableQuantity: number;
  unitCost: number;
}
