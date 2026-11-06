import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { ShopPrintDetail, ShopVariant } from '../../../core/models/shop.model';
import { getShopErrorMessage, isAbortError, ShopApiError } from '../../../core/services/shop-api.client';
import { ShopService } from '../../../core/services/shop.service';

/**
 * Estado del detalle de una impresión. Mantiene la variante seleccionada;
 * el carrito futuro leerá `selectedVariant` sin cambiar este store.
 */
@Injectable()
export class ShopPrintStore {
  private readonly shop = inject(ShopService);
  private controller: AbortController | null = null;

  private readonly _print = signal<ShopPrintDetail | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _notFound = signal(false);
  private readonly _selectedVariantId = signal<string | null>(null);

  readonly print = this._print.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly notFound = this._notFound.asReadonly();

  readonly selectedVariant = computed<ShopVariant | null>(() => {
    const variants = this._print()?.variants ?? [];
    const selectedId = this._selectedVariantId();
    return variants.find((variant) => variant._id === selectedId) ?? variants[0] ?? null;
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.controller?.abort());
  }

  selectVariant(id: string): void {
    this._selectedVariantId.set(id);
  }

  async load(slug: string): Promise<void> {
    this.controller?.abort();

    const controller = new AbortController();
    this.controller = controller;
    this._loading.set(true);
    this._error.set(null);
    this._notFound.set(false);
    this._print.set(null);
    this._selectedVariantId.set(null);

    try {
      const print = await this.shop.getPrintBySlug(slug, controller.signal);
      if (controller.signal.aborted) return;
      this._print.set(print);
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
}
