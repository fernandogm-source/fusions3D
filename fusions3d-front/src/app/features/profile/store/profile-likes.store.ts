import { inject, Injectable, signal } from '@angular/core';
import { ProfileLikeItem, ProfileLikesMeta } from '../../../core/models/profile-likes.model';
import { ProfileLikesService } from '../../../core/services/profile-likes.service';
import { VariantLikesService } from '../../../core/services/variant-likes.service';
import { getErrorMessage } from '../../../shared/utils/error-message.util';

export const PROFILE_LIKES_LIMIT = 12;

/** Estado de "Mis likes". Quitar un like recarga la página actual para mantener paginación y total exactos. */
@Injectable()
export class ProfileLikesStore {
  private readonly list = inject(ProfileLikesService);
  private readonly likes = inject(VariantLikesService);
  private readonly _items = signal<ProfileLikeItem[]>([]);
  private readonly _meta = signal<ProfileLikesMeta | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _pendingId = signal<string | null>(null);

  readonly items = this._items.asReadonly();
  readonly meta = this._meta.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly pendingId = this._pendingId.asReadonly();

  async load(page: number): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      const data = await this.list.list(page, PROFILE_LIKES_LIMIT);
      this._items.set(data.items);
      this._meta.set(data.meta);
    } catch (error) {
      this._error.set(getErrorMessage(error));
    } finally {
      this._loading.set(false);
    }
  }

  /** Devuelve true si el like se ha quitado. La recarga de la página la decide el componente. */
  async unlike(variantId: string): Promise<boolean> {
    if (this._pendingId()) return false;

    this._pendingId.set(variantId);
    try {
      await this.likes.unlike(variantId);
      return true;
    } catch {
      // El errorInterceptor ya muestra el aviso; la lista se mantiene como estaba.
      return false;
    } finally {
      this._pendingId.set(null);
    }
  }
}
