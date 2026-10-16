import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CategoriesStore } from '../../../../core/store/categories.store';
import { CategoryPayload } from '../../../../core/models/category.model';
import { CategoryForm } from '../../components/category-form/category-form';
import { showSuccess } from '../../../../shared/utils/alert.util';

@Component({ selector: 'app-category-create', imports: [CategoryForm], templateUrl: './category-create.html' })
export class CategoryCreatePage {
  private readonly store = inject(CategoriesStore);
  private readonly router = inject(Router);
  protected readonly saving = signal(false);
  protected async submit(payload: CategoryPayload): Promise<void> {
    this.saving.set(true);
    try {
      const category = await this.store.create(payload);
      if (!category) return;
      showSuccess('Categoría creada correctamente.');
      void this.router.navigate(['/admin/categories', category._id]);
    } finally { this.saving.set(false); }
  }
}
