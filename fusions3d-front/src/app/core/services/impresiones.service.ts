import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Impresion, ImpresionCreatePayload, ImpresionUpdatePayload } from '../models/impresion.model';
import { ApiService } from './api.service';

/**
 * Servicio de dominio para el recurso `/impresiones` de la API.
 * Encapsula los endpoints REST y devuelve modelos tipados.
 */
@Injectable({ providedIn: 'root' })
export class ImpresionesService {
  private readonly api = inject(ApiService);
  private readonly resource = '/impresiones';

  getAll(): Observable<Impresion[]> {
    return this.api.get<Impresion[]>(this.resource);
  }

  getActive(): Observable<Impresion[]> {
    return this.api.get<Impresion[]>(`${this.resource}/active`);
  }

  getInactive(): Observable<Impresion[]> {
    return this.api.get<Impresion[]>(`${this.resource}/inactive`);
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

  update(id: string, payload: ImpresionUpdatePayload): Observable<Impresion> {
    return this.api.patch<Impresion>(`${this.resource}/${id}`, payload);
  }

  toggleActive(id: string): Observable<Impresion> {
    return this.api.patch<Impresion>(`${this.resource}/${id}/active`, {});
  }

  softDelete(id: string): Observable<Impresion> {
    return this.api.patch<Impresion>(`${this.resource}/${id}/soft-delete`, {});
  }

  restore(id: string): Observable<Impresion> {
    return this.api.patch<Impresion>(`${this.resource}/${id}/restore`, {});
  }
}
