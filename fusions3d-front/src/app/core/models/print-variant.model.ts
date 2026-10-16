export interface VariantReference {
  _id: string;
  name: string;
  slug?: string;
}

export interface PrintVariant {
  _id: string;
  printId: string | VariantReference;
  sku: string;
  name: string;
  materialId: string | VariantReference;
  color: string;
  salePrice: number;
  costPrice: number;
  printTime: number;
  isActive: boolean;
  deletedAt: string | null;
}

export interface PrintVariantPayload {
  printId: string;
  sku: string;
  name: string;
  materialId: string;
  color: string;
  salePrice: number;
  costPrice: number;
  printTime: number;
}

export type PrintVariantUpdatePayload = Partial<PrintVariantPayload>;
