import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User, UserPayload, UserUpdatePayload } from '../models/user.model';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly api = inject(ApiService);
  private readonly resource = '/users';

  getAll(): Observable<User[]> { return this.api.get<User[]>(this.resource); }
  getActive(): Observable<User[]> { return this.api.get<User[]>(`${this.resource}/active`); }
  getInactive(): Observable<User[]> { return this.api.get<User[]>(`${this.resource}/inactive`); }
  getSoftDeleted(): Observable<User[]> { return this.api.get<User[]>(`${this.resource}/soft-deleted`); }
  getById(id: string): Observable<User> { return this.api.get<User>(`${this.resource}/${id}`); }
  create(payload: UserPayload): Observable<User> { return this.api.post<User>(this.resource, payload); }
  update(id: string, payload: UserUpdatePayload): Observable<User> {
    return this.api.patch<User>(`${this.resource}/${id}`, payload);
  }
  updateRoles(id: string, roles: string[]): Observable<User> {
    return this.api.patch<User>(`${this.resource}/${id}/roles`, { roles });
  }
  toggleActive(id: string): Observable<User> {
    return this.api.patch<User>(`${this.resource}/${id}/active`, {});
  }
  softDelete(id: string): Observable<User> {
    return this.api.patch<User>(`${this.resource}/${id}/soft-delete`, {});
  }
  restore(id: string): Observable<User> {
    return this.api.patch<User>(`${this.resource}/${id}/restore`, {});
  }
}
