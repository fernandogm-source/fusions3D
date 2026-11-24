import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  ShopReview,
  ShopReviewAiSummary,
  ShopReviewInput,
  ShopReviewResult,
  ShopReviewSummary,
  ShopVariantRatingStats,
} from '../models/shop.model';
import { ApiService } from './api.service';

/**
 * Comentarios de impresiones (`/api/shop/prints/:slug/reviews` y `/api/shop/reviews/:id`).
 * La lectura es pública; crear, editar y borrar requieren sesión.
 */
@Injectable({ providedIn: 'root' })
export class PrintReviewsService {
  private readonly api = inject(ApiService);

  list(printSlug: string, stars: number[]): Promise<ShopReview[]> {
    const params = stars.length > 0 ? { stars: stars.join(',') } : undefined;
    return firstValueFrom(this.api.get<ShopReview[]>(`/shop/prints/${encodeURIComponent(printSlug)}/reviews`, params));
  }

  getSummary(printSlug: string): Promise<ShopReviewSummary> {
    return firstValueFrom(this.api.get<ShopReviewSummary>(`/shop/prints/${encodeURIComponent(printSlug)}/reviews/summary`));
  }

  getAiSummary(printSlug: string): Promise<ShopReviewAiSummary> {
    return firstValueFrom(this.api.get<ShopReviewAiSummary>(`/shop/prints/${encodeURIComponent(printSlug)}/reviews/ai-summary`));
  }

  getMine(printSlug: string): Promise<ShopReview[]> {
    return firstValueFrom(this.api.get<ShopReview[]>(`/shop/prints/${encodeURIComponent(printSlug)}/reviews/me`));
  }

  create(printSlug: string, input: ShopReviewInput): Promise<ShopReviewResult> {
    return firstValueFrom(
      this.api.post<ShopReviewResult>(`/shop/prints/${encodeURIComponent(printSlug)}/reviews`, input),
    );
  }

  update(reviewId: string, input: Pick<ShopReviewInput, 'rating' | 'comment'>): Promise<ShopReviewResult> {
    return firstValueFrom(this.api.patch<ShopReviewResult>(`/shop/reviews/${encodeURIComponent(reviewId)}`, input));
  }

  remove(reviewId: string): Promise<{ removed: boolean; variant: ShopVariantRatingStats }> {
    return firstValueFrom(
      this.api.delete<{ removed: boolean; variant: ShopVariantRatingStats }>(`/shop/reviews/${encodeURIComponent(reviewId)}`),
    );
  }
}
