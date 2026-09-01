import type {
  OrganizationCreateRequest,
  OrganizationDto,
  OrganizationUpdateRequest,
} from "@/lib/types";
import { apiDelete, apiGet, apiPost, apiPut, qs } from "./client";

export function listOrganizations(page = 1, pageSize = 20) {
  return apiGet<OrganizationDto[]>("/organizations" + qs({ page, pageSize }));
}

export function getOrganization(id: number) {
  return apiGet<OrganizationDto>(`/organizations/${id}`);
}

export function createOrganization(body: OrganizationCreateRequest) {
  return apiPost<OrganizationDto>("/organizations", body);
}

export function updateOrganization(id: number, body: OrganizationUpdateRequest) {
  return apiPut<OrganizationDto>(`/organizations/${id}`, body);
}

export function deleteOrganization(id: number) {
  return apiDelete<boolean>(`/organizations/${id}`);
}
