import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Category, CategoryPayload, CategoryUpdatePayload } from '../models/category.model';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private readonly api = inject(ApiService);
  private readonly resource = '/categories';

  getAll(): Observable<Category[]> { return this.api.get<Category[]>(this.resource); }
  getActive(): Observable<Category[]> { return this.api.get<Category[]>(`${this.resource}/active`); }
  getInactive(): Observable<Category[]> { return this.api.get<Category[]>(`${this.resource}/inactive`); }
  getSoftDeleted(): Observable<Category[]> { return this.api.get<Category[]>(`${this.resource}/soft-deleted`); }
  getById(id: string): Observable<Category> { return this.api.get<Category>(`${this.resource}/${id}`); }
  getBySlug(slug: string): Observable<Category> {
    return this.api.get<Category>(`${this.resource}/slug/${encodeURIComponent(slug)}`);
  }
  create(payload: CategoryPayload): Observable<Category> { return this.api.post<Category>(this.resource, payload); }
  update(id: string, payload: CategoryUpdatePayload): Observable<Category> {
    return this.api.patch<Category>(`${this.resource}/${id}`, payload);
  }
  toggleActive(id: string): Observable<Category> {
    return this.api.patch<Category>(`${this.resource}/${id}/active`, {});
  }
  softDelete(id: string): Observable<Category> {
    return this.api.patch<Category>(`${this.resource}/${id}/soft-delete`, {});
  }
  restore(id: string): Observable<Category> {
    return this.api.patch<Category>(`${this.resource}/${id}/restore`, {});
  }
}
