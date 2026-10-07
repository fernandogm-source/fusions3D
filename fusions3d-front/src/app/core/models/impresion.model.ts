export type ImpresionStatus = 'published' | 'draft' | 'archived' | 'suspended';

/**
 * Modelo de una impresión 3D tal y como la devuelve la API
 * (colección "impresiones" de MongoDB).
 */
export interface Impresion {
  _id: string;
  nombre: string;
  descripcion: string;
  precio_venta: number;
  precio_coste: number;
  /** Tiempo de impresión en minutos */
  tiempo_impresion: number;
  isActive: boolean;
  status: ImpresionStatus;
  slug: string;
  /** URL de imagen opcional (el backend aún no la persiste) */
  imagen?: string;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
}

/**
 * Datos necesarios para crear una impresión.
 */
export interface ImpresionCreatePayload {
  nombre: string;
  descripcion: string;
  precio_venta: number;
  precio_coste: number;
  tiempo_impresion: number;
  status?: ImpresionStatus;
  imagen?: string;
}

/**
 * Datos para actualizar una impresión (todos opcionales,
 * pero el backend exige al menos un campo).
 */
export type ImpresionUpdatePayload = Partial<ImpresionCreatePayload>;
