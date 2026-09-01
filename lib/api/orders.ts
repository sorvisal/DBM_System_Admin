import type { OrderDto, OrderCreateRequest, OrderUpdateRequest, OrderStatusRequest, AssignDriverRequest, PaymentRequest } from "@/lib/types";
import { apiDelete, apiGet, apiPost, apiPut, qs } from "./client";

export function listOrders(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  isCompleted?: boolean;
}) {
  return apiGet<OrderDto[]>(
    "/orders" +
      qs({
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
        search: params.search,
        status: params.status,
        isCompleted: params.isCompleted,
      }),
  );
}

export function getOrderCount(params?: { status?: string; search?: string; isCompleted?: boolean }) {
  return apiGet<number>(
    "/orders/count" + qs({ status: params?.status, search: params?.search, isCompleted: params?.isCompleted }),
  );
}

export function getOrder(id: number) {
  return apiGet<OrderDto>(`/orders/${id}`);
}

export function createOrder(body: OrderCreateRequest) {
  return apiPost<OrderDto>("/orders", body);
}

export function updateOrder(id: number, body: OrderUpdateRequest) {
  return apiPut<OrderDto>(`/orders/${id}`, body);
}

export function confirmOrder(id: number) {
  return apiPost<OrderDto>(`/orders/${id}/confirm`);
}

export function assignOrderDriver(id: number, body: AssignDriverRequest) {
  return apiPost<OrderDto>(`/orders/${id}/assign-driver`, body);
}

/**
 * Manager approval: transitions a Pending order to Approved.
 * Requires admin or superadmin role.
 */
export function approveOrder(id: number) {
  return apiPost<OrderDto>(`/orders/${id}/approve`);
}

export function startDeliveryOrder(id: number, body: AssignDriverRequest) {
  return apiPost<OrderDto>(`/orders/${id}/delivery`, body);
}

export function setOrderStatus(id: number, body: OrderStatusRequest) {
  return apiPost<OrderDto>(`/orders/${id}/status`, body);
}

export function payOrder(id: number, body: PaymentRequest) {
  return apiPost<OrderDto>(`/orders/${id}/payment`, body);
}

export function completeOrder(id: number) {
  return apiPost<OrderDto>(`/orders/${id}/complete`);
}

export function uncompleteOrder(id: number) {
  return apiPost<OrderDto>(`/orders/${id}/uncomplete`);
}

export function deleteOrder(id: number) {
  return apiDelete<boolean>(`/orders/${id}`);
}
