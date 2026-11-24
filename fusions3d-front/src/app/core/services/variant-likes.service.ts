import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ShopVariantLike } from '../models/shop.model';
import { ApiService } from './api.service';

/**
 * Likes de variantes (`/api/shop/variants/:slug/likes`). Se identifican por el slug de la variante.
 * Usa `ApiService` para enviar la cookie de sesión y aprovechar la renovación automática del `authInterceptor`.
 */
@Injectable({ providedIn: 'root' })
export class VariantLikesService {
  private readonly api = inject(ApiService);

  getStatus(variantSlug: string): Promise<{ liked: boolean }> {
    return firstValueFrom(this.api.get<{ liked: boolean }>(this.path(variantSlug, '/likes/me')));
  }

  like(variantSlug: string): Promise<ShopVariantLike> {
    return firstValueFrom(this.api.post<ShopVariantLike>(this.path(variantSlug, '/likes'), {}));
  }

  unlike(variantSlug: string): Promise<ShopVariantLike> {
    return firstValueFrom(this.api.delete<ShopVariantLike>(this.path(variantSlug, '/likes')));
  }

  private path(variantSlug: string, suffix: string): string {
    return `/shop/variants/${encodeURIComponent(variantSlug)}${suffix}`;
  }
}
