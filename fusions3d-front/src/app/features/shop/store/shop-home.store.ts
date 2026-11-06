import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { ShopHome } from '../../../core/models/shop.model';
import { getShopErrorMessage, isAbortError } from '../../../core/services/shop-api.client';
import { ShopService } from '../../../core/services/shop.service';

/** Estado de la portada. Se provee en la página y cancela la carga si el usuario sale. */
@Injectable()
export class ShopHomeStore {
  private readonly shop = inject(ShopService);
  private controller: AbortController | null = null;

  private readonly _home = signal<ShopHome | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly home = this._home.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.controller?.abort());
  }

  async load(): Promise<void> {
    this.controller?.abort();

    const controller = new AbortController();
    this.controller = controller;
    this._loading.set(true);
    this._error.set(null);

    try {
      const home = await this.shop.getHome(controller.signal);
      if (controller.signal.aborted) return;
      this._home.set(home);
    } catch (error) {
      if (isAbortError(error)) return;
      this._error.set(getShopErrorMessage(error));
    } finally {
      if (this.controller === controller) {
        this.controller = null;
        this._loading.set(false);
      }
    }
  }
}
