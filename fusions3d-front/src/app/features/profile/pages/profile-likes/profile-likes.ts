import { Component, computed, effect, inject, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ProfileLikeItem } from '../../../../core/models/profile-likes.model';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { Pagination } from '../../../../shared/components/pagination/pagination';
import { formatPrecio } from '../../../../shared/utils/format.util';
import { placeholderImage } from '../../../../shared/utils/placeholder-image.util';
import { ProfileLikesStore } from '../../store/profile-likes.store';

/** "Mis likes": la página vive en la URL (`?page=`). Cada tarjeta enlaza a la variante en el detalle. */
@Component({
  selector: 'app-profile-likes',
  imports: [RouterLink, RouterLinkActive, PageHeader, Pagination, ErrorState, EmptyState],
  providers: [ProfileLikesStore],
  templateUrl: './profile-likes.html',
})
export class ProfileLikesPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly store = inject(ProfileLikesStore);

  private readonly params = toSignal(this.route.queryParams, { initialValue: this.route.snapshot.queryParams });
  protected readonly page = computed(() => readPage(this.params()['page']));
  protected readonly totalPages = computed(() => this.store.meta()?.totalPages ?? 0);
  protected readonly total = computed(() => this.store.meta()?.total ?? 0);
  protected readonly price = formatPrecio;

  constructor() {
    effect(() => {
      const page = this.page();
      untracked(() => void this.loadPage(page));
    });
  }

  protected imageOf(item: ProfileLikeItem): string {
    return item.cover?.imageUrl || placeholderImage(item.printSlug, item.printName);
  }

  protected async onUnlike(variantId: string): Promise<void> {
    if (await this.store.unlike(variantId)) await this.loadPage(this.page());
  }

  protected onPage(page: number): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: page > 1 ? page : null },
      queryParamsHandling: 'merge',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected retry(): void {
    void this.loadPage(this.page());
  }

  /** Carga la página; si ya no existe (p. ej. tras quitar un like), navega a la última disponible. */
  private async loadPage(page: number): Promise<void> {
    await this.store.load(page);

    const last = Math.max(this.totalPages(), 1);
    if (page > last) {
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { page: last > 1 ? last : null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }
  }
}

function readPage(value: unknown): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const page = Number(raw);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}
