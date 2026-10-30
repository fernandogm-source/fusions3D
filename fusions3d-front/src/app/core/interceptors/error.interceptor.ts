import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { showError } from '../../shared/utils/alert.util';
import { getErrorMessage } from '../../shared/utils/error-message.util';

/**
 * Control de errores global: muestra con SweetAlert2 los errores de la API.
 * No muestra los 401 (los gestiona authInterceptor) ni los de /auth
 * (el formulario de login los muestra en línea).
 *
 * El error se relanza para que las capas superiores (stores,
 * componentes) puedan actualizar también su estado.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const isAuthRoute = req.url.startsWith(`${environment.apiUrl}/auth/`);

  return next(req).pipe(
    catchError((error: unknown) => {
      const isUnauthorized = error instanceof HttpErrorResponse && error.status === 401;
      if (!isAuthRoute && !isUnauthorized) {
        showError(getErrorMessage(error));
      }
      return throwError(() => error);
    }),
  );
};
