import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ShopColor } from '../../../../core/models/shop.model';

/** Card de color para el home. Muestra el color real si el backend lo tiene y enlaza al catálogo filtrado. */
@Component({
  selector: 'app-color-card',
  imports: [RouterLink],
  templateUrl: './color-card.html',
})
export class ColorCard {
  readonly color = input.required<ShopColor>();

  protected readonly swatch = computed(() => this.color().hex ?? '#64748b');
}
