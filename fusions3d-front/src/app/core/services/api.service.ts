import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, InvalidApiResponseError } from '../models/api-response.model';

/**
 * Servicio centralizado de acceso a la API REST.
 *
 * Responsabilidades:
 * - Construir las URLs a partir del `baseUrl` del entorno.
 * - Aplicar un timeout a todas las peticiones.
 * - Serializar (desenvolver) las respuestas `{ success, data }`.
 * - Rechazar respuestas con formato inválido.
 *
 * Los errores HTTP y de red se gestionan de forma global
 * en el `errorInterceptor`.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;
  private readonly timeoutMs = environment.apiTimeout;

  get<T>(endpoint: string, params?: Record<string, string | number | boolean>): Observable<T> {
    return this.http
      .get<ApiResponse<T>>(this.buildUrl(endpoint), { params: this.buildParams(params) })
      .pipe(timeout(this.timeoutMs), map((res) => this.unwrap(res)));
  }

  post<T>(endpoint: string, body: unknown): Observable<T> {
    return this.http
      .post<ApiResponse<T>>(this.buildUrl(endpoint), body)
      .pipe(timeout(this.timeoutMs), map((res) => this.unwrap(res)));
  }

  patch<T>(endpoint: string, body: unknown): Observable<T> {
    return this.http
      .patch<ApiResponse<T>>(this.buildUrl(endpoint), body)
      .pipe(timeout(this.timeoutMs), map((res) => this.unwrap(res)));
  }

  put<T>(endpoint: string, body: unknown): Observable<T> {
    return this.http
      .put<ApiResponse<T>>(this.buildUrl(endpoint), body)
      .pipe(timeout(this.timeoutMs), map((res) => this.unwrap(res)));
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http
      .delete<ApiResponse<T>>(this.buildUrl(endpoint))
      .pipe(timeout(this.timeoutMs), map((res) => this.unwrap(res)));
  }

  private buildUrl(endpoint: string): string {
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${this.baseUrl}${path}`;
  }

  private buildParams(params?: Record<string, string | number | boolean>): HttpParams | undefined {
    if (!params) return undefined;
    return new HttpParams({ fromObject: params });
  }

  /**
   * Serialización de respuestas: desenvuelve `data` del sobre
   * `{ success, data }` y valida que el formato sea el esperado.
   */
  private unwrap<T>(response: ApiResponse<T>): T {
    if (!response || typeof response !== 'object' || response.success !== true || !('data' in response)) {
      throw new InvalidApiResponseError();
    }
    return response.data;
  }
}
