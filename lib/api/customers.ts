import type { CustomerDetailDto, CustomerDto, CustomerRequest, OrderDto } from "@/lib/types";
import { apiDelete, apiGet, apiPost, apiPut, qs } from "./client";

export function listCustomers(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}) {
  return apiGet<CustomerDto[]>(
    "/customers" +
      qs({
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
        search: params.search,
        status: params.status,
      }),
  );
}

export function getCustomerCount(params?: { status?: string; search?: string }) {
  return apiGet<number>("/customers/count" + qs({ status: params?.status, search: params?.search }));
}

export function getCustomer(id: number) {
  return apiGet<CustomerDetailDto>(`/customers/${id}`);
}

export function getCustomerOrders(id: number) {
  return apiGet<OrderDto[]>(`/customers/${id}/orders`);
}

export function createCustomer(body: CustomerRequest) {
  return apiPost<CustomerDto>("/customers", body);
}

export function updateCustomer(id: number, body: CustomerRequest) {
  return apiPut<CustomerDto>(`/customers/${id}`, body);
}

export function deleteCustomer(id: number) {
  return apiDelete<boolean>(`/customers/${id}`);
}
