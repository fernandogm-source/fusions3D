import { Component, DestroyRef, effect, inject, input, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CategoriesStore } from '../../../../core/store/categories.store';
import { ErrorState } from '../../../../shared/components/error-state/error-state';

@Component({ selector: 'app-category-detail', imports: [RouterLink, ErrorState], templateUrl: './category-detail.html' })
export class CategoryDetailPage {
  readonly id = input.required<string>();
  protected readonly store = inject(CategoriesStore);
  protected readonly category = this.store.selected;
  constructor() {
    effect(() => { const id = this.id(); untracked(() => void this.store.loadById(id)); });
    inject(DestroyRef).onDestroy(() => this.store.clearSelected());
  }
  protected retry(): void { void this.store.loadById(this.id()); }
}
