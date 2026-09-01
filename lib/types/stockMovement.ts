export interface StockMovementDto {
  id: number;
  productId: number;
  productName: string | null;
  type: string | null;
  quantity: number;
  referenceType: string | null;
  referenceId: number | null;
  userId: number | null;
  note: string | null;
  createdAt: string;
  balanceAfter: number;
}

export interface StockAdjustRequest {
  productId: number;
  type: string | null;
  quantity: number;
  note: string | null;
}
