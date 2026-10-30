import { Component, input } from '@angular/core';

/**
 * Cabecera común de las páginas: etiqueta, título, descripción y
 * acciones (botones) proyectadas a la derecha.
 */
@Component({ selector: 'app-page-header', templateUrl: './page-header.html' })
export class PageHeader {
  readonly eyebrow = input('');
  readonly title = input.required<string>();
  readonly description = input('');
}
