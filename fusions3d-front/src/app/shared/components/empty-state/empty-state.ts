import { Component, input } from '@angular/core';

/** Estado vacío: se muestra cuando no hay resultados. */
@Component({
  selector: 'app-empty-state',
  templateUrl: './empty-state.html',
})
export class EmptyState {
  readonly title = input<string>('Sin resultados');
  readonly message = input<string>('No hay elementos para mostrar en este momento.');
}
