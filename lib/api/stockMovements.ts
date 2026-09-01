import type { StockAdjustRequest, StockMovementDto } from "@/lib/types";
import { apiDelete, apiGet, apiPost, qs } from "./client";

export function listStockMovements(params: {
  page?: number;
  pageSize?: number;
  productId?: string | number;
  type?: string;
  from?: string;
  to?: string;
}) {
  return apiGet<StockMovementDto[]>(
    "/stock/movements" +
      qs({
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
        productId: params.productId,
        type: params.type,
        from: params.from,
        to: params.to,
      }),
  );
}

export function getStockMovementCount(params?: { productId?: string | number; type?: string; from?: string; to?: string }) {
  return apiGet<number>(
    "/stock/movements/count" + qs({ productId: params?.productId, type: params?.type, from: params?.from, to: params?.to }),
  );
}

export function adjustStock(body: StockAdjustRequest) {
  return apiPost<StockMovementDto>("/stock/movements", body);
}

export function deleteStockMovement(id: number) {
  return apiDelete<boolean>(`/stock/movements/${id}`);
}

export function fixNegativeStock() {
  return apiPost<{ fixedCount: number; fixedNames: string[] }>(`/stock/fix-negative`);
}
