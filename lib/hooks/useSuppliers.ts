import { useLoadingState } from "./useDebounce";
import { listSuppliers } from "@/lib/api/suppliers";
import type { SupplierDto } from "@/lib/types";

export function useSuppliers() {
  const { data, loading, error, reload } = useLoadingState(() => listSuppliers(), []);
  return {
    suppliers: (data?.data ?? []) as SupplierDto[],
    loading,
    error,
    reload,
  };
}
