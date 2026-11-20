import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, firstValueFrom, from, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiErrorBody } from '../models/api-response.model';
import { AuthService } from '../services/auth.service';
import { AuthStore } from '../store/auth.store';

/** Rutas de autenticación que nunca intentan renovar la sesión (evita bucles). */
const ROUTES_WITHOUT_RENEWAL = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

/** Renovación compartida: varias peticiones 401 a la vez esperan al mismo /auth/refresh. */
let pendingRenewal: Promise<void> | null = null;

function renewSession(authService: AuthService): Promise<void> {
  pendingRenewal ??= firstValueFrom(authService.refresh())
    .then(() => undefined)
    .finally(() => {
      pendingRenewal = null;
    });
  return pendingRenewal;
}

function getErrorCode(error: HttpErrorResponse): string | undefined {
  return (error.error as Partial<ApiErrorBody> | undefined)?.error?.code;
}

/**
 * Envía la cookie de sesión en las peticiones a la API y gestiona los 401:
 * - ACCESS_TOKEN_EXPIRED: pide /auth/refresh y reintenta la petición original.
 * - SESSION_EXPIRED (o no se puede renovar): pide /auth/logout y lleva al login con aviso.
 * - AUTHENTICATION_REQUIRED: visitante sin sesión; solo limpia el estado local.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const auth = inject(AuthStore);
  const authService = inject(AuthService);
  const router = inject(Router);
  const canRenew = !ROUTES_WITHOUT_RENEWAL.some((route) => req.url.startsWith(`${environment.apiUrl}${route}`));
  const request = req.clone({ withCredentials: true });

  const expireSession = () => {
    void auth.expireSession().then(() =>
      router.navigate(['/login'], { queryParams: { reason: 'expired', returnUrl: router.url } }),
    );
  };

  return next(request).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401 || !canRenew) {
        return throwError(() => error);
      }

      const code = getErrorCode(error);

      if (code === 'ACCESS_TOKEN_EXPIRED') {
        return from(renewSession(authService)).pipe(
          catchError((renewError: unknown) => {
            if (renewError instanceof HttpErrorResponse && renewError.status === 401) {
              expireSession();
            }
            return throwError(() => renewError);
          }),
          switchMap(() => next(request)),
        );
      }

      if (code === 'AUTHENTICATION_REQUIRED' && !auth.isAuthenticated()) {
        auth.clearSession();
        return throwError(() => error);
      }

      expireSession();
      return throwError(() => error);
    }),
  );
};
