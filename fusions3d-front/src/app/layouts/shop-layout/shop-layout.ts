import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { SearchInput } from '../../shared/components/search-input/search-input';
import { emptyShopQuery, parseShopQuery, searchQueryParams } from '../../shared/utils/shop-query.util';

/** Layout público de la tienda: cabecera con buscador, navegación, contenido y pie. No requiere sesión. */
@Component({
  selector: 'app-shop-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, SearchInput],
  templateUrl: './shop-layout.html',
})
export class ShopLayout {
  private readonly router = inject(Router);
  protected readonly year = new Date().getFullYear();
  protected readonly mobileSearchOpen = signal(false);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  private readonly currentTree = computed(() => this.router.parseUrl(this.currentUrl()));

  /** `true` solo en el catálogo (`/shop`), no en el detalle. */
  protected readonly onCatalog = computed(
    () => this.currentTree().root.children['primary']?.segments.map((segment) => segment.path).join('/') === 'shop',
  );

  protected readonly searchValue = computed(() =>
    this.onCatalog() ? parseShopQuery(this.currentTree().queryParams).q : '',
  );

  protected onSearch(text: string): void {
    const onCatalog = this.onCatalog();
    if (!text && !onCatalog) return;

    const base = onCatalog ? parseShopQuery(this.currentTree().queryParams) : emptyShopQuery();
    void this.router.navigate(['/shop'], {
      queryParams: searchQueryParams(base, text),
      replaceUrl: onCatalog,
    });
  }
}
