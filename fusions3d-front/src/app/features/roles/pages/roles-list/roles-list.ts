import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { RolesStore } from '../../../../core/store/roles.store';
import { Role } from '../../../../core/models/role.model';
import { RoleTable } from '../../components/role-table/role-table';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { confirmAction, showSuccess } from '../../../../shared/utils/alert.util';

@Component({ selector: 'app-roles-list', imports: [RoleTable, EmptyState, ErrorState, PageHeader], templateUrl: './roles-list.html' })
export class RolesListPage {
  protected readonly store = inject(RolesStore); private readonly router = inject(Router);
  constructor() { void this.store.loadAll(); }
  protected showTrash(value: boolean): void { void (value ? this.store.loadSoftDeleted(true) : this.store.loadAll(true)); }
  protected retry(): void { void (this.store.trashView() ? this.store.loadSoftDeleted(true) : this.store.loadAll(true)); }
  protected create(): void { void this.router.navigate(['/admin/roles/nuevo']); }
  protected async remove(role: Role): Promise<void> {
    if (!(await confirmAction({ title: '¿Eliminar rol?', text: `"${role.name}" se moverá a la papelera.`, confirmText: 'Sí, eliminar' }))) return;
    if (await this.store.softDelete(role)) showSuccess('Rol eliminado.');
    else this.store.clearError();
  }
  protected async toggle(role: Role): Promise<void> {
    if (await this.store.toggleActive(role)) showSuccess('Estado del rol actualizado.');
    else this.store.clearError();
  }
  protected async restore(role: Role): Promise<void> {
    if (await this.store.restore(role)) showSuccess('Rol restaurado.');
    else this.store.clearError();
  }
}
