import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MaterialsStore } from '../../../../core/store/materials.store';
import { Material } from '../../../../core/models/material.model';
import { MaterialTable } from '../../components/material-table/material-table';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { confirmAction, showSuccess } from '../../../../shared/utils/alert.util';

@Component({ selector: 'app-materials-list', imports: [MaterialTable, EmptyState, ErrorState, PageHeader], templateUrl: './materials-list.html' })
export class MaterialsListPage {
  protected readonly store = inject(MaterialsStore);
  private readonly router = inject(Router);
  constructor() { void this.store.loadAll(); }
  protected showTrash(value: boolean): void { void (value ? this.store.loadSoftDeleted(true) : this.store.loadAll(true)); }
  protected retry(): void { void (this.store.trashView() ? this.store.loadSoftDeleted(true) : this.store.loadAll(true)); }
  protected async remove(material: Material): Promise<void> {
    if (!(await confirmAction({ title: '¿Eliminar material?', text: `"${material.name}" se moverá a la papelera.`, confirmText: 'Sí, eliminar' }))) return;
    if (await this.store.softDelete(material)) showSuccess('Material eliminado.');
    else this.store.clearError();
  }
  protected async toggle(material: Material): Promise<void> {
    if (await this.store.toggleActive(material)) showSuccess('Estado del material actualizado.');
    else this.store.clearError();
  }
  protected async restore(material: Material): Promise<void> {
    if (await this.store.restore(material)) showSuccess('Material restaurado.');
    else this.store.clearError();
  }
  protected create(): void { void this.router.navigate(['/admin/materials/nuevo']); }
}
