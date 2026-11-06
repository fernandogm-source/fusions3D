import { Component, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ShopPrintCard } from '../../../../core/models/shop.model';
import { formatRangoPrecio } from '../../../../shared/utils/format.util';
import { placeholderImage } from '../../../../shared/utils/placeholder-image.util';

/** Card de una impresión: imagen, nombre, categoría, materiales y precio. Enlaza al detalle. */
@Component({
  selector: 'app-print-card',
  imports: [RouterLink],
  templateUrl: './print-card.html',
})
export class PrintCard {
  readonly print = input.required<ShopPrintCard>();

  protected readonly imageFailed = signal(false);

  protected readonly image = computed(() => {
    const print = this.print();
    const url = print.cover?.imageUrl;
    return url && !this.imageFailed() ? url : placeholderImage(print.slug, print.name);
  });

  protected readonly price = computed(() => {
    const print = this.print();
    return formatRangoPrecio(print.minPrice, print.maxPrice);
  });

  protected readonly visibleMaterials = computed(() => this.print().materials.slice(0, 3));

  protected readonly hiddenMaterials = computed(() => Math.max(this.print().materials.length - 3, 0));
}
