import type { ProductDto, ProductSummaryDto, ProductUpsertRequest, UploadResultDto } from "@/lib/types";
import { apiDelete, apiGet, apiPost, apiPostMultipart, apiPut, qs } from "./client";

export function listProducts(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string | number;
  lowStock?: boolean;
}) {
  return apiGet<ProductDto[]>(
    "/products" +
      qs({
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
        search: params.search,
        categoryId: params.categoryId,
        lowStock: params.lowStock ? true : undefined,
      }),
  );
}

export function getProductCount(params?: { search?: string; categoryId?: string | number; lowStock?: boolean }) {
  return apiGet<number>(
    "/products/count" +
      qs({
        search: params?.search,
        categoryId: params?.categoryId,
        lowStock: params?.lowStock ? true : undefined,
      }),
  );
}

export function getProduct(id: number) {
  return apiGet<ProductDto>(`/products/${id}`);
}

export function getProductSummary() {
  return apiGet<ProductSummaryDto>("/products/summary");
}

export function createProduct(body: ProductUpsertRequest) {
  return apiPost<ProductDto>("/products", body);
}

export function updateProduct(id: number, body: ProductUpsertRequest) {
  return apiPut<ProductDto>(`/products/${id}`, body);
}

export function deleteProduct(id: number) {
  return apiDelete<boolean>(`/products/${id}`);
}

export function uploadProductImage(file: File) {
  const fd = new FormData();
  fd.append("file", file);
  return apiPostMultipart<UploadResultDto>("/products/images", fd);
}
