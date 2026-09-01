import type { PurchaseCreateRequest, PurchaseOrderDto, PurchaseStatusRequest, PurchasePaymentRequest } from "@/lib/types";
import { apiDelete, apiGet, apiPost, qs } from "./client";

export function listPurchaseOrders(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}) {
  return apiGet<PurchaseOrderDto[]>(
    "/purchase-orders" +
      qs({
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
        search: params.search,
        status: params.status,
      }),
  );
}

export function getPurchaseOrderCount(params?: { status?: string; search?: string }) {
  return apiGet<number>(
    "/purchase-orders/count" + qs({ status: params?.status, search: params?.search }),
  );
}

export function getPurchaseOrder(id: number) {
  return apiGet<PurchaseOrderDto>(`/purchase-orders/${id}`);
}

export function createPurchaseOrder(body: PurchaseCreateRequest) {
  return apiPost<PurchaseOrderDto>("/purchase-orders", body);
}

export function confirmPurchaseOrder(id: number) {
  return apiPost<PurchaseOrderDto>(`/purchase-orders/${id}/confirm`);
}

export function setPurchaseOrderStatus(id: number, body: PurchaseStatusRequest) {
  return apiPost<PurchaseOrderDto>(`/purchase-orders/${id}/status`, body);
}

export function receivePurchaseOrder(id: number) {
  return apiPost<PurchaseOrderDto>(`/purchase-orders/${id}/receive`);
}

export function deletePurchaseOrder(id: number) {
  return apiDelete<boolean>(`/purchase-orders/${id}`);
}

export function payPurchaseOrder(id: number, body: PurchasePaymentRequest) {
  return apiPost<PurchaseOrderDto>(`/purchase-orders/${id}/payment`, body);
}
