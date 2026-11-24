import { Component, computed, effect, inject, input, untracked } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ShopImage, ShopVariant } from '../../../../core/models/shop.model';
import { Carousel } from '../../../../shared/components/carousel/carousel';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { formatPrecio, formatRangoPrecio, formatTiempoImpresion } from '../../../../shared/utils/format.util';
import { placeholderImage } from '../../../../shared/utils/placeholder-image.util';
import { PrintReviews } from '../../components/print-reviews/print-reviews';
import { StarRating } from '../../components/star-rating/star-rating';
import { VariantLike } from '../../components/variant-like/variant-like';
import { VariantSelector } from '../../components/variant-selector/variant-selector';
import { ShopPrintStore } from '../../store/shop-print.store';

/** Detalle público de una impresión: galería, información, variantes, precio y valoraciones. */
@Component({
  selector: 'app-shop-print-detail',
  imports: [RouterLink, Carousel, VariantSelector, VariantLike, StarRating, PrintReviews, ErrorState, EmptyState],
  providers: [ShopPrintStore],
  templateUrl: './print-detail.html',
})
export class ShopPrintDetailPage {
  readonly slug = input.required<string>();
  /** Variante preseleccionada desde la URL (`?variant=`). */
  readonly variant = input<string>();
  protected readonly store = inject(ShopPrintStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

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

  protected ratingLabel(variant: ShopVariant): string {
    const count = variant.ratingCount ?? 0;
    if (count === 0) return 'Sin valoraciones';

    const average = (variant.ratingAverage ?? 0).toLocaleString('es-ES', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    const word = count === 1 ? 'valoración' : 'valoraciones';
    return `${average} · ${count} ${word}`;
  }

  constructor() {
    effect(() => {
      const slug = this.slug();
      untracked(() => void this.store.load(slug, this.variant() ?? null));
    });
  }

  protected retry(): void {
    void this.store.load(this.slug(), this.variant() ?? null);
  }

  /**
   * Cambia la variante y la refleja en la URL, para que recargar o volver atrás la mantengan.
   * La URL se actualiza sin navegar: una navegación del router llevaría la página al inicio.
   */
  protected selectVariant(id: string): void {
    this.store.selectVariant(id);
    const url = this.router.serializeUrl(
      this.router.createUrlTree([], {
        relativeTo: this.route,
        queryParams: { variant: id },
        queryParamsHandling: 'merge',
      }),
    );
    history.replaceState(history.state, '', url);
  }
}
