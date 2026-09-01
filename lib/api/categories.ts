import type { CategoryDto, CategoryRequest } from "@/lib/types";
import { apiDelete, apiGet, apiPost, apiPut } from "./client";

export function listCategories() {
  return apiGet<CategoryDto[]>("/categories");
}

export function getCategoryCount() {
  return apiGet<number>("/categories/count");
}

export function getCategory(id: number) {
  return apiGet<CategoryDto>(`/categories/${id}`);
}

export function createCategory(body: CategoryRequest) {
  return apiPost<CategoryDto>("/categories", body);
}

export function updateCategory(id: number, body: CategoryRequest) {
  return apiPut<CategoryDto>(`/categories/${id}`, body);
}

export function deleteCategory(id: number) {
  return apiDelete<boolean>(`/categories/${id}`);
}
