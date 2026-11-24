import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ShopPrintDetail, ShopVariant } from '../../../core/models/shop.model';
import { getShopErrorMessage, isAbortError, ShopApiError } from '../../../core/services/shop-api.client';
import { ShopService } from '../../../core/services/shop.service';
import { VariantLikesService } from '../../../core/services/variant-likes.service';
import { AuthStore } from '../../../core/store/auth.store';

/**
 * Estado del detalle de una impresión. Las variantes se identifican por su slug: la selección,
 * los likes marcados y las llamadas a la API usan ese slug. El botón de like siempre actúa sobre
 * `selectedVariant`.
 */
@Injectable()
export class ShopPrintStore {
  private readonly shop = inject(ShopService);
  private readonly likes = inject(VariantLikesService);
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  private controller: AbortController | null = null;

  private readonly _print = signal<ShopPrintDetail | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _notFound = signal(false);
  private readonly _selectedSlug = signal<string | null>(null);
  private readonly _likedSlugs = signal<ReadonlySet<string>>(new Set());
  private readonly _likePending = signal(false);

  readonly print = this._print.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly notFound = this._notFound.asReadonly();
  readonly likePending = this._likePending.asReadonly();

  readonly selectedVariant = computed<ShopVariant | null>(() => {
    const variants = this._print()?.variants ?? [];
    const selectedSlug = this._selectedSlug();
    return variants.find((variant) => variant.slug === selectedSlug) ?? variants[0] ?? null;
  });

  readonly selectedLiked = computed(() => {
    const slug = this.selectedVariant()?.slug;
    return slug !== undefined && this._likedSlugs().has(slug);
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.controller?.abort());
  }

  selectVariant(slug: string): void {
    this._selectedSlug.set(slug);
    void this.loadLikeStatus(slug);
  }

  async load(slug: string, variantSlug: string | null = null): Promise<void> {
    this.controller?.abort();

    const controller = new AbortController();
    this.controller = controller;
    this._loading.set(true);
    this._error.set(null);
    this._notFound.set(false);
    this._print.set(null);
    this._selectedSlug.set(null);
    this._likedSlugs.set(new Set());

    try {
      const print = await this.shop.getPrintBySlug(slug, controller.signal);
      if (controller.signal.aborted) return;
      this._print.set(print);

      const initialSlug =
        print.variants.find((variant) => variant.slug === variantSlug)?.slug ?? print.variants[0]?.slug ?? null;
      this._selectedSlug.set(initialSlug);
      if (initialSlug) void this.loadLikeStatus(initialSlug);
    } catch (error) {
      if (isAbortError(error)) return;
      if (error instanceof ShopApiError && error.status === 404) {
        this._notFound.set(true);
      } else {
        this._error.set(getShopErrorMessage(error));
      }
    } finally {
      if (this.controller === controller) {
        this.controller = null;
        this._loading.set(false);
      }
    }
  }

  /** Da o quita el like de la variante seleccionada. Los anónimos van al login. */
  async toggleLike(): Promise<void> {
    const variant = this.selectedVariant();
    if (!variant || this._likePending()) return;

    await this.auth.restoreSession();
    if (!this.auth.isAuthenticated()) {
      const slug = this._print()?.slug ?? '';
      void this.router.navigate(['/login'], { queryParams: { returnUrl: `/shop/${slug}` } });
      return;
    }

    const slug = variant.slug;
    const wasLiked = this._likedSlugs().has(slug);
    const delta = wasLiked ? -1 : 1;

    this.setLiked(slug, !wasLiked);
    this.patchVariant(slug, (current) => ({ likesCount: Math.max(0, current.likesCount + delta) }));
    this._likePending.set(true);

    try {
      const result = wasLiked ? await this.likes.unlike(slug) : await this.likes.like(slug);
      this.setLiked(slug, result.liked);
      this.patchVariant(slug, () => ({ likesCount: result.likesCount }));
    } catch {
      this.setLiked(slug, wasLiked);
      this.patchVariant(slug, (current) => ({ likesCount: Math.max(0, current.likesCount - delta) }));
    } finally {
      this._likePending.set(false);
    }
  }

  private async loadLikeStatus(variantSlug: string): Promise<void> {
    await this.auth.restoreSession();
    if (!this.auth.isAuthenticated()) return;

    try {
      const { liked } = await this.likes.getStatus(variantSlug);
      this.setLiked(variantSlug, liked);
    } catch {
      // El recuento ya se muestra desde el detalle; si falla el estado, el botón queda sin marcar.
    }
  }

  private setLiked(variantSlug: string, liked: boolean): void {
    this._likedSlugs.update((slugs) => {
      const next = new Set(slugs);
      if (liked) next.add(variantSlug);
      else next.delete(variantSlug);
      return next;
    });
  }

  private patchVariant(variantSlug: string, change: (variant: ShopVariant) => Partial<ShopVariant>): void {
    this._print.update((print) => {
      if (!print) return print;
      return {
        ...print,
        variants: print.variants.map((variant) =>
          variant.slug === variantSlug ? { ...variant, ...change(variant) } : variant,
        ),
      };
    });
  }
}
