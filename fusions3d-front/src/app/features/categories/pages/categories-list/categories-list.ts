import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CategoriesStore } from '../../../../core/store/categories.store';
import { Category } from '../../../../core/models/category.model';
import { CategoryTable } from '../../components/category-table/category-table';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { confirmAction, showSuccess } from '../../../../shared/utils/alert.util';

@Component({ selector: 'app-categories-list', imports: [CategoryTable, EmptyState, ErrorState, PageHeader], templateUrl: './categories-list.html' })
export class CategoriesListPage {
  protected readonly store = inject(CategoriesStore);
  private readonly router = inject(Router);
  constructor() { void this.store.loadAll(); }
  protected showTrash(value: boolean): void { void (value ? this.store.loadSoftDeleted(true) : this.store.loadAll(true)); }
  protected retry(): void { void (this.store.trashView() ? this.store.loadSoftDeleted(true) : this.store.loadAll(true)); }
  protected async remove(category: Category): Promise<void> {
    if (!(await confirmAction({ title: '¿Eliminar categoría?', text: `"${category.name}" se moverá a la papelera.`, confirmText: 'Sí, eliminar' }))) return;
    if (await this.store.softDelete(category)) showSuccess('Categoría eliminada.');
    else this.store.clearError();
  }
  protected async toggle(category: Category): Promise<void> {
    if (await this.store.toggleActive(category)) showSuccess(category.isActive ? 'Categoría desactivada.' : 'Categoría activada.');
    else this.store.clearError();
  }
  protected async restore(category: Category): Promise<void> {
    if (await this.store.restore(category)) showSuccess('Categoría restaurada.');
    else this.store.clearError();
  }
  protected openCreate(): void { void this.router.navigate(['/admin/categories/nueva']); }
}
