import { apiGet, qs } from "./client";
import type { StockBatchDto, StockBatchSummaryDto } from "@/lib/types";

export function listStockBatches(params: {
  page?: number;
  pageSize?: number;
  productId?: number;
  fromExpiry?: string;
  toExpiry?: string;
}) {
  return apiGet<StockBatchDto[]>(
    "/stock/batches" +
      qs({
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
        productId: params.productId,
        fromExpiry: params.fromExpiry,
        toExpiry: params.toExpiry,
      }),
  );
}

export function getProductStockBatches(productId: number) {
  return apiGet<StockBatchSummaryDto[]>(`/stock/products/${productId}/batches`);
}
