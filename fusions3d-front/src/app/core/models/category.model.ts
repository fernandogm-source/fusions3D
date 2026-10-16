export type CategoryStatus = 'published' | 'draft' | 'archived' | 'suspended';

export interface Category {
  _id: string;
  name: string;
  slug: string;
  status: CategoryStatus;
  isActive: boolean;
  deletedAt: string | null;
}

export interface CategoryPayload {
  name: string;
  status?: CategoryStatus;
}

export type CategoryUpdatePayload = Partial<CategoryPayload>;

/** Category poblada dentro de una impresión. */
export interface PrintCategory {
  _id: string;
  name: string;
  slug: string;
}
