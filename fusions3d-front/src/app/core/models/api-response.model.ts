/**
 * Envoltura estándar de las respuestas de la API de Fusions3D.
 * Ejemplo: { "success": true, "data": ... }
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * Cuerpo de error estándar devuelto por el backend.
 * Ejemplo: { "success": false, "error": { "code": "...", "message": "..." } }
 */
export interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: { field: string; message: string }[];
  };
}

/**
 * Error lanzado cuando la respuesta del servidor no cumple
 * el formato esperado (serialización inválida).
 */
export class InvalidApiResponseError extends Error {
  constructor() {
    super('La respuesta del servidor no tiene el formato esperado');
    this.name = 'InvalidApiResponseError';
  }
}
