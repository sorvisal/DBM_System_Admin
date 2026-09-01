import type { CustomerTypeDto, CustomerTypeRequest } from "@/lib/types";
import { apiGet, apiPost } from "./client";

export function listCustomerTypes() {
  return apiGet<CustomerTypeDto[]>("/customer-types");
}

export function createCustomerType(body: CustomerTypeRequest) {
  return apiPost<CustomerTypeDto>("/customer-types", body);
}
