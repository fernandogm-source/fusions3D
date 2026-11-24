import { Component, input, output } from '@angular/core';

/** Botón de "me gusta" de una variante. Muestra el recuento y emite cuando el usuario lo pulsa. */
@Component({
  selector: 'app-variant-like',
  templateUrl: './variant-like.html',
})
export class VariantLike {
  readonly liked = input.required<boolean>();
  readonly count = input.required<number>();
  readonly pending = input(false);
  readonly toggle = output<void>();
}
