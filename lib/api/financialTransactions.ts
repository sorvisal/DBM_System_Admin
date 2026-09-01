import type { ApiResponse, FinancialTransactionDto, FinancialSummaryDto, FinancialQueryParams } from "@/lib/types";
import { apiGet, qs } from "./client";

export function listFinancialTransactions(params?: FinancialQueryParams): Promise<ApiResponse<FinancialTransactionDto[]>> {
  return apiGet<FinancialTransactionDto[]>(
    "/financial-transactions" +
      qs({
        type: params?.type,
        referenceType: params?.referenceType,
        from: params?.from,
        to: params?.to,
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 20,
      }),
  );
}

export function getFinancialTransactionCount(params?: Pick<FinancialQueryParams, "type" | "referenceType" | "from" | "to">) {
  return apiGet<number>(
    "/financial-transactions/count" +
      qs({
        type: params?.type,
        referenceType: params?.referenceType,
        from: params?.from,
        to: params?.to,
      }),
  );
}

export function getFinancialSummary() {
  return apiGet<FinancialSummaryDto>("/financial-transactions/summary");
}

export function getFinancialCashFlowChart(range = "7d") {
  return apiGet<{ label: string; revenue: number }[]>("/financial-transactions/cash-flow-chart" + qs({ range }));
}
