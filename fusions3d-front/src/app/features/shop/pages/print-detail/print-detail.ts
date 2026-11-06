import { Component, computed, effect, inject, input, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ShopImage } from '../../../../core/models/shop.model';
import { Carousel } from '../../../../shared/components/carousel/carousel';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { formatPrecio, formatRangoPrecio, formatTiempoImpresion } from '../../../../shared/utils/format.util';
import { placeholderImage } from '../../../../shared/utils/placeholder-image.util';
import { VariantSelector } from '../../components/variant-selector/variant-selector';
import { ShopPrintStore } from '../../store/shop-print.store';

/** Detalle público de una impresión: galería, información, variantes y precio. */
@Component({
  selector: 'app-shop-print-detail',
  imports: [RouterLink, Carousel, VariantSelector, ErrorState, EmptyState],
  providers: [ShopPrintStore],
  templateUrl: './print-detail.html',
})
export class ShopPrintDetailPage {
  readonly slug = input.required<string>();
  protected readonly store = inject(ShopPrintStore);

  protected readonly images = computed<ShopImage[]>(() => {
    const print = this.store.print();
    if (!print) return [];
    return print.images.length
      ? print.images
      : [{ imageUrl: placeholderImage(print.slug, print.name), altText: print.name }];
  });

  protected readonly priceRange = computed(() => {
    const print = this.store.print();
    return print ? formatRangoPrecio(print.minPrice, print.maxPrice) : '';
  });

  protected readonly selectedPrice = computed(() => {
    const variant = this.store.selectedVariant();
    return variant ? formatPrecio(variant.salePrice) : '';
  });

  protected readonly printTime = formatTiempoImpresion;

  constructor() {
    effect(() => {
      const slug = this.slug();
      untracked(() => void this.store.load(slug));
    });
  }

  protected retry(): void {
    void this.store.load(this.slug());
  }
}
