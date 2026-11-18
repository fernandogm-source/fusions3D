import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Impresion,
  ImpresionCreatePayload,
  ImpresionDescribeRequest,
  ImpresionDescription,
  ImpresionUpdatePayload,
} from '../models/impresion.model';
import { ApiService } from './api.service';

/** La generación con IA puede tardar más que el timeout general de la API. */
const AI_DESCRIBE_TIMEOUT_MS = 60000;

/**
 * Servicio de dominio para el recurso `/prints` de la API.
 * Encapsula los endpoints REST y devuelve modelos tipados.
 */
@Injectable({ providedIn: 'root' })
export class ImpresionesService {
  private readonly api = inject(ApiService);
  private readonly resource = '/prints';

  getAll(): Observable<Impresion[]> {
    return this.api.get<Impresion[]>(this.resource);
  }

  getActive(): Observable<Impresion[]> {
    return this.api.get<Impresion[]>(`${this.resource}/active`);
  }

  getInactive(): Observable<Impresion[]> {
    return this.api.get<Impresion[]>(`${this.resource}/inactive`);
  }

  getSoftDeleted(): Observable<Impresion[]> {
    return this.api.get<Impresion[]>(`${this.resource}/soft-deleted`);
  }

  getById(id: string): Observable<Impresion> {
    return this.api.get<Impresion>(`${this.resource}/${id}`);
  }

  getBySlug(slug: string): Observable<Impresion> {
    return this.api.get<Impresion>(`${this.resource}/slug/${encodeURIComponent(slug)}`);
  }

  create(payload: ImpresionCreatePayload): Observable<Impresion> {
    return this.api.post<Impresion>(this.resource, payload);
  }

  describeWithAi(payload: ImpresionDescribeRequest): Observable<ImpresionDescription> {
    return this.api.post<ImpresionDescription>(`${this.resource}/ai/describe`, payload, AI_DESCRIBE_TIMEOUT_MS);
  }

  update(id: string, payload: ImpresionUpdatePayload): Observable<Impresion> {
    return this.api.patch<Impresion>(`${this.resource}/${id}`, payload);
  }

  toggleActive(id: string, active: boolean): Observable<Impresion> {
    return this.api.patch<Impresion>(`${this.resource}/${id}/active`, { active });
  }

  softDelete(id: string): Observable<Impresion> {
    return this.api.patch<Impresion>(`${this.resource}/${id}/soft-delete`, {});
  }

  restore(id: string): Observable<Impresion> {
    return this.api.patch<Impresion>(`${this.resource}/${id}/restore`, {});
  }
}
