import { Component, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ShopCategory } from '../../../../core/models/shop.model';
import { placeholderImage } from '../../../../shared/utils/placeholder-image.util';

/** Card de categoría para el home. Enlaza al catálogo filtrado por esa categoría. */
@Component({
  selector: 'app-category-card',
  imports: [RouterLink],
  templateUrl: './category-card.html',
})
export class CategoryCard {
  readonly category = input.required<ShopCategory>();
  protected readonly imageFailed = signal(false);

  protected readonly image = computed(() => {
    const category = this.category();
    const url = category.image?.imageUrl;
    return url && !this.imageFailed() ? url : placeholderImage(category.slug, category.name);
  });
}
