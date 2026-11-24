import { Component, input, output } from '@angular/core';
import { ShopVariant } from '../../../../core/models/shop.model';
import { formatTiempoImpresion } from '../../../../shared/utils/format.util';

/** Selector de variantes (material + color). El precio se muestra en la cabecera del detalle. Emite la variante elegida. */
@Component({
  selector: 'app-variant-selector',
  templateUrl: './variant-selector.html',
})
export class VariantSelector {
  readonly variants = input.required<ShopVariant[]>();
  readonly selectedSlug = input.required<string | null>();
  readonly select = output<string>();

  protected readonly printTime = formatTiempoImpresion;
}
