import { useLoadingState } from "./useDebounce";
import { listCustomers } from "@/lib/api/customers";
import type { CustomerDto } from "@/lib/types";

export interface UseCustomersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}

export function useCustomers(params: UseCustomersParams) {
  const { data, loading, error, reload } = useLoadingState(
    () => listCustomers(params),
    [params.page, params.pageSize, params.search, params.status],
  );
  return {
    customers: (data?.data ?? []) as CustomerDto[],
    meta: data?.meta ?? null,
    loading,
    error,
    reload,
  };
}
