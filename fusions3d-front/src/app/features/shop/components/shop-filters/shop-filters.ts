import { Component, input, output } from '@angular/core';
import { ShopFilters } from '../../../../core/models/shop.model';
import { PriceRangeSlider } from '../../../../shared/components/price-range-slider/price-range-slider';
import { PriceRange } from '../../../../shared/utils/price-range.util';

export type ShopFilterGroup = 'category' | 'material' | 'color';

/** Panel de filtros del catálogo. No guarda estado: emite cambios y la página decide la URL. */
@Component({
  selector: 'app-shop-filters',
  imports: [PriceRangeSlider],
  templateUrl: './shop-filters.html',
})
export class ShopFiltersPanel {
  readonly filters = input<ShopFilters | null>(null);
  readonly selectedCategories = input<string[]>([]);
  readonly selectedMaterials = input<string[]>([]);
  readonly selectedColors = input<string[]>([]);
  readonly minPrice = input<number | null>(null);
  readonly maxPrice = input<number | null>(null);

  readonly toggle = output<{ group: ShopFilterGroup; slug: string }>();
  readonly priceChange = output<PriceRange>();
  readonly clear = output<void>();

  protected onToggle(group: ShopFilterGroup, slug: string): void {
    this.toggle.emit({ group, slug });
  }
}
