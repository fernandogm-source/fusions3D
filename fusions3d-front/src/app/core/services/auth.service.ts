import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { AuthUser, LoginPayload, LoginResponse } from '../models/auth.model';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly resource = '/auth';

  login(payload: LoginPayload): Observable<LoginResponse> {
    return this.api.post<LoginResponse>(`${this.resource}/login`, payload);
  }

  me(): Observable<AuthUser> {
    return this.api.get<{ user: AuthUser }>(`${this.resource}/me`).pipe(map((data) => data.user));
  }

  logout(): Observable<null> {
    return this.api.post<null>(`${this.resource}/logout`, {});
  }
}
