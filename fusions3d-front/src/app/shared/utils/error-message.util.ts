import { HttpErrorResponse } from '@angular/common/http';
import { TimeoutError } from 'rxjs';
import { ApiErrorBody, InvalidApiResponseError } from '../../core/models/api-response.model';

/**
 * Traduce cualquier error (red, HTTP, backend, timeout,
 * formato inválido) a un mensaje amigable para el usuario.
 */
export function getErrorMessage(error: unknown): string {
  // Timeout aplicado en el ApiService
  if (error instanceof TimeoutError || (error instanceof Error && error.name === 'TimeoutError')) {
    return 'La solicitud ha excedido el tiempo de espera. Inténtalo de nuevo.';
  }

  // Respuesta con formato inválido (serialización)
  if (error instanceof InvalidApiResponseError) {
    return 'La respuesta del servidor no tiene el formato esperado.';
  }

  if (error instanceof HttpErrorResponse) {
    // Error de red / API caída / CORS
    if (error.status === 0) {
      return 'No se puede conectar con el servidor. Comprueba que la API está en ejecución.';
    }

    // Mensaje enviado por el backend: { success: false, error: { code, message, details } }
    const body = error.error as Partial<ApiErrorBody> | undefined;
    const backendMessage = body?.error?.message;
    if (backendMessage) {
      const details = body?.error?.details?.map((d) => d.message).filter(Boolean).join(' ');
      return details ? `${backendMessage} ${details}` : backendMessage;
    }

    switch (error.status) {
      case 400:
        return 'La solicitud no es válida. Revisa los datos enviados.';
      case 401:
        return 'No estás autorizado para realizar esta acción.';
      case 403:
        return 'Acceso denegado.';
      case 404:
        return 'El recurso solicitado no existe.';
      case 409:
        return 'Conflicto: el recurso ya existe o ha sido modificado.';
      case 500:
        return 'Error interno del servidor. Inténtalo más tarde.';
      default:
        return `Error inesperado del servidor (HTTP ${error.status}).`;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Ha ocurrido un error inesperado.';
}

export function isDependencyUnavailable(error: unknown): boolean {
  if (!(error instanceof HttpErrorResponse)) return false;
  const body = error.error as Partial<ApiErrorBody> | undefined;
  return body?.error?.code === 'DEPENDENCY_UNAVAILABLE';
}
