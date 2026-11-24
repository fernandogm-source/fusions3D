import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminReviewPrint } from '../../../../core/models/admin-review.model';
import { AdminReviewsService } from '../../../../core/services/admin-reviews.service';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { getErrorMessage } from '../../../../shared/utils/error-message.util';

/** Primer nivel del panel de comentarios: impresiones con valoraciones, para entrar en cada una. */
@Component({
  selector: 'app-reviews-prints',
  imports: [DecimalPipe, EmptyState, ErrorState, PageHeader, RouterLink],
  templateUrl: './reviews-prints.html',
})
export class ReviewsPrintsPage {
  private readonly service = inject(AdminReviewsService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly prints = signal<AdminReviewPrint[]>([]);

  constructor() {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      this.prints.set(await this.service.listPrints());
    } catch (error) {
      this.error.set(getErrorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }
}
