import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthStore } from '../../../core/store/auth.store';
import { ProfileStore } from '../../../core/store/profile.store';
import { SearchInput } from '../search-input/search-input';
import { UserAvatar } from '../user-avatar/user-avatar';
import { emptyShopQuery, parseShopQuery, searchQueryParams } from '../../utils/shop-query.util';

/** Cabecera pública compartida: logo, buscador, navegación y acceso a la sesión. */
@Component({
  selector: 'app-store-header',
  imports: [RouterLink, RouterLinkActive, SearchInput, UserAvatar],
  templateUrl: './store-header.html',
})
export class StoreHeader {
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthStore);
  protected readonly profile = inject(ProfileStore);
  protected readonly mobileSearchOpen = signal(false);
  protected readonly initial = computed(() => this.auth.user()?.username.charAt(0).toUpperCase() ?? '');

  constructor() {
    void this.auth.restoreSession();

    effect(() => {
      if (this.auth.isAuthenticated() && !this.profile.profile()) {
        void this.profile.load();
      }
    });
  }

  protected logout(): void {
    void this.auth.logout();
  }

  protected readonly currentUrl = toSignal(
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
