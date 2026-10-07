import { Component, input, output } from '@angular/core';

/** Estado de error: fallo de la API con opción de reintentar. */
@Component({
  selector: 'app-error-state',
  templateUrl: './error-state.html',
})
export class ErrorState {
  readonly title = input<string>('Algo ha ido mal');
  readonly message = input<string>('No se han podido cargar los datos.');
  readonly retry = output<void>();
}
