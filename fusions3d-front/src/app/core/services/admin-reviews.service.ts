import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AdminPrintSentiment, AdminReviewPrint, AdminReviewsPage } from '../models/admin-review.model';
import { ShopVariantRatingStats } from '../models/shop.model';
import { ApiService } from './api.service';

/** Gestión de comentarios desde el panel de administración (`/api/reviews`, solo ADMIN). */
@Injectable({ providedIn: 'root' })
export class AdminReviewsService {
  private readonly api = inject(ApiService);

  listPrints(): Promise<AdminReviewPrint[]> {
    return firstValueFrom(this.api.get<AdminReviewPrint[]>('/reviews/prints'));
  }

  list(printId: string, page: number, limit: number, stars: number | null): Promise<AdminReviewsPage> {
    const params: Record<string, number | string> = { printId, page, limit };
    if (stars !== null) params['stars'] = String(stars);
    return firstValueFrom(this.api.get<AdminReviewsPage>('/reviews', params));
  }

  sentiment(printId: string): Promise<AdminPrintSentiment> {
    return firstValueFrom(this.api.get<AdminPrintSentiment>(`/reviews/prints/${encodeURIComponent(printId)}/sentiment`));
  }

  remove(reviewId: string): Promise<{ removed: boolean; variant: ShopVariantRatingStats }> {
    return firstValueFrom(
      this.api.delete<{ removed: boolean; variant: ShopVariantRatingStats }>(`/reviews/${encodeURIComponent(reviewId)}`),
    );
  }
}
