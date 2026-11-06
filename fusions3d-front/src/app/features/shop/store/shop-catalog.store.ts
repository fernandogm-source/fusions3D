import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import {
  ShopCatalogQuery,
  ShopFilters,
  ShopPageMeta,
  ShopPrintCard,
} from '../../../core/models/shop.model';
import { getShopErrorMessage, isAbortError } from '../../../core/services/shop-api.client';
import { ShopService } from '../../../core/services/shop.service';

/**
 * Estado del catálogo. Se provee en la página (no es global): cada visita empieza limpia
 * y la URL restaura los filtros.
 *
 * Evita condiciones de carrera: cada carga cancela la anterior con AbortController y
 * solo la última puede modificar el estado.
 */
@Injectable()
export class ShopCatalogStore {
  private readonly shop = inject(ShopService);
  private catalogController: AbortController | null = null;
  private filtersController: AbortController | null = null;

  private readonly _prints = signal<ShopPrintCard[]>([]);
  private readonly _meta = signal<ShopPageMeta | null>(null);
  private readonly _filters = signal<ShopFilters | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly prints = this._prints.asReadonly();
  readonly meta = this._meta.asReadonly();
  readonly filters = this._filters.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly isEmpty = computed(
    () => !this._loading() && this._error() === null && this._meta()?.total === 0,
  );

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.catalogController?.abort();
      this.filtersController?.abort();
    });
  }

  async loadFilters(): Promise<void> {
    if (this._filters() || this.filtersController) return;

    const controller = new AbortController();
    this.filtersController = controller;

    try {
      const filters = await this.shop.getFilters(controller.signal);
      this._filters.set(filters);
    } catch (error) {
      if (!isAbortError(error)) this._error.set(getShopErrorMessage(error));
    } finally {
      if (this.filtersController === controller) this.filtersController = null;
    }
  }

  async loadPrints(query: ShopCatalogQuery): Promise<void> {
    this.catalogController?.abort();

    const controller = new AbortController();
    this.catalogController = controller;
    this._loading.set(true);
    this._error.set(null);

    try {
      const page = await this.shop.getPrints(query, controller.signal);
      if (controller.signal.aborted) return;

      this._prints.set(page.data);
      this._meta.set(page.meta);
    } catch (error) {
      if (isAbortError(error)) return;
      this._error.set(getShopErrorMessage(error));
    } finally {
      if (this.catalogController === controller) {
        this.catalogController = null;
        this._loading.set(false);
      }
    }
  }
}
