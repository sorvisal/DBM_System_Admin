export interface OrganizationDto {
  id: number;
  name: string | null;
  slug: string | null;
  description: string | null;
  createdAt: string;
}

export interface OrganizationCreateRequest {
  name: string | null;
  slug: string | null;
  description: string | null;
}

export interface OrganizationUpdateRequest {
  name: string | null;
  slug: string | null;
  description: string | null;
}
