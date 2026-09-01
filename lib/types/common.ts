export interface ApiMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  meta?: ApiMeta;
  error?: string | null;
}

export interface PagedQuery {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface RevenuePointDto {
  label: string;
  revenue: number;
}

export interface RevenueReportDto {
  period: string;
  from: string;
  to: string;
  revenue: number;
}

export interface ReceivableDto {
  customerId: number;
  customerName: string;
  balance: number;
}
