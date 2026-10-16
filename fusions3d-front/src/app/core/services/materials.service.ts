import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Material, MaterialPayload, MaterialUpdatePayload } from '../models/material.model';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class MaterialsService {
  private readonly api = inject(ApiService);
  private readonly resource = '/materials';

  getAll(): Observable<Material[]> { return this.api.get<Material[]>(this.resource); }
  getActive(): Observable<Material[]> { return this.api.get<Material[]>(`${this.resource}/active`); }
  getInactive(): Observable<Material[]> { return this.api.get<Material[]>(`${this.resource}/inactive`); }
  getSoftDeleted(): Observable<Material[]> { return this.api.get<Material[]>(`${this.resource}/soft-deleted`); }
  getById(id: string): Observable<Material> { return this.api.get<Material>(`${this.resource}/${id}`); }
  create(payload: MaterialPayload): Observable<Material> { return this.api.post<Material>(this.resource, payload); }
  update(id: string, payload: MaterialUpdatePayload): Observable<Material> {
    return this.api.patch<Material>(`${this.resource}/${id}`, payload);
  }
  toggleActive(id: string): Observable<Material> {
    return this.api.patch<Material>(`${this.resource}/${id}/active`, {});
  }
  softDelete(id: string): Observable<Material> {
    return this.api.patch<Material>(`${this.resource}/${id}/soft-delete`, {});
  }
  restore(id: string): Observable<Material> {
    return this.api.patch<Material>(`${this.resource}/${id}/restore`, {});
  }
}
