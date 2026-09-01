import type {
  CustomerOrderLinkDto,
  CustomerOrderLinkRequest,
  CustomerOrderLinkSummaryDto,
} from "@/lib/types/customerOrderLink";
import { apiDelete, apiGet, apiPost, apiPut, qs } from "./client";

export function listCustomerOrderLinks(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}) {
  return apiGet<CustomerOrderLinkDto[]>(
    "/customer-order-links" +
      qs({
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
        search: params.search,
        status: params.status,
      }),
  );
}

export function getCustomerOrderLinksSummary() {
  return apiGet<CustomerOrderLinkSummaryDto>("/customer-order-links/summary");
}

export function getCustomerOrderLink(id: number) {
  return apiGet<CustomerOrderLinkDto>(`/customer-order-links/${id}`);
}

export function createCustomerOrderLink(body: CustomerOrderLinkRequest) {
  return apiPost<CustomerOrderLinkDto>("/customer-order-links", body);
}

export function updateCustomerOrderLink(id: number, body: CustomerOrderLinkRequest) {
  return apiPut<CustomerOrderLinkDto>(`/customer-order-links/${id}`, body);
}

export function deleteCustomerOrderLink(id: number) {
  return apiDelete<boolean>(`/customer-order-links/${id}`);
}

export function activateCustomerOrderLink(id: number) {
  return apiPost<CustomerOrderLinkDto>(`/customer-order-links/${id}/activate`);
}

export function deactivateCustomerOrderLink(id: number) {
  return apiPost<CustomerOrderLinkDto>(`/customer-order-links/${id}/deactivate`);
}

export function regenerateCustomerOrderLinkToken(id: number) {
  return apiPost<CustomerOrderLinkDto>(`/customer-order-links/${id}/regenerate`);
}
