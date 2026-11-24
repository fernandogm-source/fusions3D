import { Component, computed, input, output } from '@angular/core';
import { DecimalPipe, NgTemplateOutlet } from '@angular/common';

/**
 * Estrellas de 1 a 5. En modo lectura muestra la media redondeada; con `interactive` cada estrella
 * es un botón y emite la valoración elegida.
 */
@Component({
  selector: 'app-star-rating',
  imports: [DecimalPipe, NgTemplateOutlet],
  templateUrl: './star-rating.html',
})
export class StarRating {
  readonly value = input(0);
  readonly interactive = input(false);
  readonly valueChange = output<number>();

  protected readonly stars = [1, 2, 3, 4, 5];
  protected readonly filled = computed(() => Math.round(this.value()));
}
