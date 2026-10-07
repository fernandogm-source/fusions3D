import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { showError } from '../../shared/utils/alert.util';
import { getErrorMessage } from '../../shared/utils/error-message.util';

/**
 * Control de errores global: captura errores de red, errores HTTP
 * y errores devueltos por el backend, y los muestra con SweetAlert2.
 *
 * El error se relanza para que las capas superiores (stores,
 * componentes) puedan actualizar también su estado.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: unknown) => {
      showError(getErrorMessage(error));
      return throwError(() => error);
    }),
  );
};
