import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

/** Error de la API de la tienda, con el código HTTP y el mensaje del backend. */
export class ShopApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ShopApiError';
  }
}

/** Cliente `fetch` para la parte pública. Cancela peticiones con AbortController y aplica timeout. */
@Injectable({ providedIn: 'root' })
export class ShopApiClient {
  private readonly baseUrl = `${environment.apiUrl}/shop`;
  private readonly timeoutMs = environment.apiTimeout;

  async get<T extends { success: true; data: unknown }>(
    path: string,
    params: Record<string, string> = {},
    signal?: AbortSignal,
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const timeout = AbortSignal.timeout(this.timeoutMs);
    const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;

    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: combined,
    });

    const body = await response.json().catch(() => null);

    if (!response.ok) {
      const message = body?.error?.message ?? `Error del servidor (HTTP ${response.status}).`;
      throw new ShopApiError(response.status, message);
    }

    if (!body || body.success !== true || !('data' in body)) {
      throw new ShopApiError(response.status, 'La respuesta del servidor no tiene el formato esperado.');
    }

    return body as T;
  }
}

/** Traduce cualquier error de la tienda a un mensaje para el usuario. */
export function getShopErrorMessage(error: unknown): string {
  if (error instanceof ShopApiError) return error.message;

  if (error instanceof DOMException && error.name === 'TimeoutError') {
    return 'La solicitud ha excedido el tiempo de espera. Inténtalo de nuevo.';
  }

  if (error instanceof TypeError) {
    return 'No se puede conectar con el servidor. Comprueba que la API está en ejecución.';
  }

  return 'Ha ocurrido un error inesperado.';
}

/** `true` si la petición se canceló a propósito (no es un error para el usuario). */
export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}
