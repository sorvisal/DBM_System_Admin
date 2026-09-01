export interface CategoryDto {
  id: number;
  name: string | null;
  description: string | null;
}

export interface CategoryRequest {
  name: string | null;
  description: string | null;
}
