import { Component, computed, effect, inject, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { ShopCatalogQuery, ShopSort } from '../../../../core/models/shop.model';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { Pagination } from '../../../../shared/components/pagination/pagination';
import { PriceRange, toPriceFilter } from '../../../../shared/utils/price-range.util';
import { parseShopQuery, toShopParams } from '../../../../shared/utils/shop-query.util';
import { PrintList } from '../../components/print-list/print-list';
import { ShopFilterGroup, ShopFiltersPanel } from '../../components/shop-filters/shop-filters';
import { ShopCatalogStore } from '../../store/shop-catalog.store';

/**
 * Catálogo público. La URL es la fuente de verdad: cada cambio de filtro, búsqueda,
 * orden o página escribe la URL, y el store carga los datos a partir de ella.
 */
@Component({
  selector: 'app-shop-catalog',
  imports: [ShopFiltersPanel, PrintList, Pagination, ErrorState, EmptyState],
  providers: [ShopCatalogStore],
  templateUrl: './catalog.html',
})
export class ShopCatalogPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly store = inject(ShopCatalogStore);

  private readonly params = toSignal(this.route.queryParams, {
    initialValue: this.route.snapshot.queryParams,
  });
  protected readonly query = computed(() => parseShopQuery(this.params()));

  protected readonly resultsLabel = computed(() => {
    const total = this.store.meta()?.total;
    if (total === undefined) return 'Cargando impresiones…';
    return total === 1 ? '1 impresión' : `${total} impresiones`;
  });

  constructor() {
    void this.store.loadFilters();

    effect(() => {
      const query = this.query();
      untracked(() => void this.store.loadPrints(query));
    });
  }

  protected onToggle({ group, slug }: { group: ShopFilterGroup; slug: string }): void {
    const current = this.query()[group];
    const next = current.includes(slug) ? current.filter((value) => value !== slug) : [...current, slug];
    this.navigate({ [group]: next, page: 1 } as Partial<ShopCatalogQuery>);
  }

  protected onPrice(range: PriceRange): void {
    const bounds = this.store.filters()?.priceRange;
    if (!bounds) return;
    this.navigate({ ...toPriceFilter(range, bounds), page: 1 }, true);
  }

  protected onSort(sort: string): void {
    this.navigate({ sort: sort as ShopSort, page: 1 });
  }

  protected onPage(page: number): void {
    this.navigate({ page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected onClear(): void {
    this.navigate({ q: '', category: [], material: [], color: [], minPrice: null, maxPrice: null, page: 1 });
  }

  protected retry(): void {
    void this.store.loadPrints(this.query());
  }

  private navigate(changes: Partial<ShopCatalogQuery>, replaceUrl = false): void {
    const next: ShopCatalogQuery = { ...this.query(), ...changes };
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: toShopParams(next),
      replaceUrl,
    });
  }
}
