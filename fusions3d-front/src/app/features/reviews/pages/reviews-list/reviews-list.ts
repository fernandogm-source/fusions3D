import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminPrintSentiment, AdminReview } from '../../../../core/models/admin-review.model';
import { ShopPageMeta } from '../../../../core/models/shop.model';
import { AdminReviewsService } from '../../../../core/services/admin-reviews.service';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { Pagination } from '../../../../shared/components/pagination/pagination';
import { confirmAction, showSuccess } from '../../../../shared/utils/alert.util';
import { getErrorMessage } from '../../../../shared/utils/error-message.util';
import { StarRating } from '../../../shop/components/star-rating/star-rating';

const PAGE_SIZE = 20;

/** Comentarios de una impresión (todas sus variantes): filtro por estrellas, paginación y borrado. */
@Component({
  selector: 'app-reviews-list',
  imports: [DatePipe, EmptyState, ErrorState, PageHeader, Pagination, RouterLink, StarRating],
  templateUrl: './reviews-list.html',
})
export class ReviewsListPage {
  private readonly service = inject(AdminReviewsService);

  readonly printId = input.required<string>();

  protected readonly starOptions = [1, 2, 3, 4, 5];
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly items = signal<AdminReview[]>([]);
  protected readonly meta = signal<ShopPageMeta>({ total: 0, page: 1, limit: PAGE_SIZE, totalPages: 0 });
  protected readonly stars = signal<number | null>(null);
  protected readonly printName = signal<string | null>(null);
  protected readonly title = computed(() => this.printName() ?? 'Comentarios');
  protected readonly sentiment = signal<AdminPrintSentiment | null>(null);
  protected readonly sentimentLoading = signal(false);
  protected readonly sentimentError = signal<string | null>(null);
  private requestId = 0;

  constructor() {
    effect(() => {
      const printId = this.printId();
      untracked(() => {
        this.stars.set(null);
        void this.load(1);
        void this.loadSentiment();
      });
    });
  }

  protected async loadSentiment(): Promise<void> {
    this.sentimentLoading.set(true);
    this.sentimentError.set(null);

    try {
      this.sentiment.set(await this.service.sentiment(this.printId()));
    } catch (error) {
      this.sentimentError.set(getErrorMessage(error));
    } finally {
      this.sentimentLoading.set(false);
    }
  }

  protected async load(page = this.meta().page): Promise<void> {
    const id = ++this.requestId;
    this.loading.set(true);
    this.error.set(null);

    try {
      const data = await this.service.list(this.printId(), page, PAGE_SIZE, this.stars());
      if (id !== this.requestId) return;
      this.items.set(data.items);
      this.meta.set(data.meta);
      this.printName.set(data.print?.name ?? null);
    } catch (error) {
      if (id === this.requestId) this.error.set(getErrorMessage(error));
    } finally {
      if (id === this.requestId) this.loading.set(false);
    }
  }

  protected onStarsChange(value: string): void {
    this.stars.set(value === '' ? null : Number(value));
    void this.load(1);
  }

  protected variantText(review: AdminReview): string {
    return [review.variantColor, review.materialName, review.variantSku].filter(Boolean).join(' · ');
  }

  protected async remove(review: AdminReview): Promise<void> {
    const confirmed = await confirmAction({
      title: '¿Eliminar comentario?',
      text: `El comentario de "${review.username ?? 'usuario'}" se borrará definitivamente.`,
      confirmText: 'Sí, eliminar',
    });
    if (!confirmed) return;

    try {
      await this.service.remove(review._id);
      showSuccess('Comentario eliminado.');
      const isLastOnPage = this.items().length === 1 && this.meta().page > 1;
      await this.load(isLastOnPage ? this.meta().page - 1 : this.meta().page);
      void this.loadSentiment();
    } catch {
      // El interceptor global ya muestra el error del servidor.
    }
  }
}
