import { DependencyIssue } from './dependency-issue.model';

export interface VariantReference {
  _id: string;
  name: string;
  slug?: string;
  deletedAt?: string | null;
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
  createdAt?: string;
  updatedAt?: string;
  dependencyIssues?: DependencyIssue[];
}

export interface PrintVariantPayload {
  printId: string;
  name: string;
  materialId: string;
  color: string;
  salePrice: number;
  costPrice: number;
  printTime: number;
}

export type PrintVariantUpdatePayload = Partial<PrintVariantPayload>;
