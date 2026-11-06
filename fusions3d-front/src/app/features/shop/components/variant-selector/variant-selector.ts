import { Component, input, output } from '@angular/core';
import { ShopVariant } from '../../../../core/models/shop.model';
import { formatPrecio, formatTiempoImpresion } from '../../../../shared/utils/format.util';

/** Selector de variantes (material + color) con su precio. Emite la variante elegida. */
@Component({
  selector: 'app-variant-selector',
  templateUrl: './variant-selector.html',
})
export class VariantSelector {
  readonly variants = input.required<ShopVariant[]>();
  readonly selectedId = input.required<string | null>();
  readonly select = output<string>();

  protected readonly price = formatPrecio;
  protected readonly printTime = formatTiempoImpresion;
}
