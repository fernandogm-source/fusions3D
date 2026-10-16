import { PrintCategory } from './category.model';
import { PrintImage } from './image.model';

export type ImpresionStatus = 'published' | 'draft' | 'archived' | 'suspended';

/**
 * Modelo de una impresión 3D tal y como la devuelve la API
 * (colección "prints" de MongoDB).
 */
export interface Impresion {
  _id: string;
  name: string;
  description: string;
  categoryId: string | PrintCategory | null;
  isActive: boolean;
  status: ImpresionStatus;
  slug: string;
  images?: PrintImage[];
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
}

/**
 * Datos necesarios para crear una impresión.
 */
export interface ImpresionCreatePayload {
  name: string;
  description: string;
  categoryId: string;
  status?: ImpresionStatus;
}

/**
 * Datos para actualizar una impresión (todos opcionales,
 * pero el backend exige al menos un campo).
 */
export type ImpresionUpdatePayload = Partial<ImpresionCreatePayload>;
