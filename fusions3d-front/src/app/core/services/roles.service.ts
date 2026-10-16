import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Role, RolePayload, RoleUpdatePayload } from '../models/role.model';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class RolesService {
  private readonly api = inject(ApiService);
  private readonly resource = '/roles';

  getAll(): Observable<Role[]> { return this.api.get<Role[]>(this.resource); }
  getActive(): Observable<Role[]> { return this.api.get<Role[]>(`${this.resource}/active`); }
  getInactive(): Observable<Role[]> { return this.api.get<Role[]>(`${this.resource}/inactive`); }
  getSoftDeleted(): Observable<Role[]> { return this.api.get<Role[]>(`${this.resource}/soft-deleted`); }
  getById(id: string): Observable<Role> { return this.api.get<Role>(`${this.resource}/${id}`); }
  create(payload: RolePayload): Observable<Role> { return this.api.post<Role>(this.resource, payload); }
  update(id: string, payload: RoleUpdatePayload): Observable<Role> {
    return this.api.patch<Role>(`${this.resource}/${id}`, payload);
  }
  toggleActive(id: string): Observable<Role> {
    return this.api.patch<Role>(`${this.resource}/${id}/active`, {});
  }
  softDelete(id: string): Observable<Role> {
    return this.api.patch<Role>(`${this.resource}/${id}/soft-delete`, {});
  }
  restore(id: string): Observable<Role> {
    return this.api.patch<Role>(`${this.resource}/${id}/restore`, {});
  }
}
