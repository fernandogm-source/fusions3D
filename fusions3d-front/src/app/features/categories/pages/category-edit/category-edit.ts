import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { CategoriesStore } from '../../../../core/store/categories.store';
import { CategoryPayload } from '../../../../core/models/category.model';
import { CategoryForm } from '../../components/category-form/category-form';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { showSuccess } from '../../../../shared/utils/alert.util';

@Component({ selector: 'app-category-edit', imports: [CategoryForm, ErrorState], templateUrl: './category-edit.html' })
export class CategoryEditPage {
  readonly id = input.required<string>();
  protected readonly store = inject(CategoriesStore);
  private readonly router = inject(Router);
  protected readonly category = this.store.selected;
  protected readonly saving = signal(false);
  constructor() { effect(() => { const id = this.id(); untracked(() => void this.store.loadById(id)); }); }
  protected retry(): void { void this.store.loadById(this.id()); }
  protected async submit(payload: CategoryPayload): Promise<void> {
    this.saving.set(true);
    try {
      const updated = await this.store.update(this.id(), payload);
      if (!updated) return;
      showSuccess('Categoría actualizada.');
      void this.router.navigate(['/admin/categories']);
    }
    finally { this.saving.set(false); }
  }
}
