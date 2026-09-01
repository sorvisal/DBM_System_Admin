import type { ApiResponse, PagedQuery, RevenuePointDto, RevenueReportDto } from "@/lib/types";

export interface FinancialTransactionDto {
  id: number;
  transactionDate: string;
  transactionType: string;
  referenceType: string;
  referenceId: number;
  referenceCode: string | null;
  amount: number;
  description: string | null;
  createdBy: number | null;
  createdByName: string | null;
  createdAt: string;
}

export interface FinancialSummaryDto {
  totalSales: number;
  totalPurchases: number;
  totalRefunds: number;
  netCashFlow: number;
  currentBalance: number;
}

export interface FinancialQueryParams extends PagedQuery {
  type?: string;
  referenceType?: string;
  from?: string;
  to?: string;
}
