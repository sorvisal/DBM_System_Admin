import type { SupplierDto, SupplierRequest } from "@/lib/types";
import { apiDelete, apiGet, apiPost, apiPut } from "./client";

export function listSuppliers() {
  return apiGet<SupplierDto[]>("/suppliers");
}

export function getSupplierCount() {
  return apiGet<number>("/suppliers/count");
}

export function getSupplier(id: number) {
  return apiGet<SupplierDto>(`/suppliers/${id}`);
}

export function createSupplier(body: SupplierRequest) {
  return apiPost<SupplierDto>("/suppliers", body);
}

export function updateSupplier(id: number, body: SupplierRequest) {
  return apiPut<SupplierDto>(`/suppliers/${id}`, body);
}

export function deleteSupplier(id: number) {
  return apiDelete<boolean>(`/suppliers/${id}`);
}
