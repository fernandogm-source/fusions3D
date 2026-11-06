import { Component, computed, input, output } from '@angular/core';

/** Paginación por páginas numeradas con elipsis. Emite el número de página elegido. */
@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.html',
})
export class Pagination {
  readonly page = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly pageChange = output<number>();

  /** Números de página a mostrar; `null` representa una elipsis. */
  protected readonly items = computed<(number | null)[]>(() => {
    const total = this.totalPages();
    const current = this.page();
    if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);

    const visible = [...new Set([1, total, current - 1, current, current + 1])]
      .filter((page) => page >= 1 && page <= total)
      .sort((a, b) => a - b);

    return visible.flatMap((page, index) => {
      const previous = visible[index - 1];
      return previous !== undefined && page - previous > 1 ? [null, page] : [page];
    });
  });

  protected go(page: number): void {
    if (page >= 1 && page <= this.totalPages() && page !== this.page()) {
      this.pageChange.emit(page);
    }
  }
}
