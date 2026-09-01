export interface ProductDto {
  id: number;
  sku: string;
  name: string;
  categoryId: number;
  categoryName: string;
  price: number;
  costPrice: number;
  stockQty: number;
  lowStockThreshold: number;
  expiryDate?: string | null;
  manufactureDate?: string | null;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  photoPath?: string | null;
}

export interface ProductUpsertRequest {
  sku: string | null;
  name: string | null;
  categoryId: number;
  price: number;
  costPrice: number;
  stockQty: number;
  lowStockThreshold: number;
  expiryDate: string | null;
  manufactureDate: string | null;
  description: string | null;
  isActive: boolean;
  photoPath: string | null;
}

export interface ProductSummaryDto {
  totalSkus: number;
  lowStockCount: number;
  outOfStockCount: number;
  expiringCount: number;
}

export interface UploadResultDto {
  url: string;
}
