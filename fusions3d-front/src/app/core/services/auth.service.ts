import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { AuthUser, LoginPayload, LoginResponse, RegisterPayload } from '../models/auth.model';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly resource = '/auth';

  register(payload: RegisterPayload): Observable<{ user: Omit<AuthUser, 'role'> }> {
    return this.api.post<{ user: Omit<AuthUser, 'role'> }>(`${this.resource}/register`, payload);
  }

  login(payload: LoginPayload): Observable<LoginResponse> {
    return this.api.post<LoginResponse>(`${this.resource}/login`, payload);
  }

  refresh(): Observable<LoginResponse> {
    return this.api.post<LoginResponse>(`${this.resource}/refresh`, {});
  }

  me(): Observable<AuthUser> {
    return this.api.get<{ user: AuthUser }>(`${this.resource}/me`).pipe(map((data) => data.user));
  }

  logout(): Observable<null> {
    return this.api.post<null>(`${this.resource}/logout`, {});
  }
}
