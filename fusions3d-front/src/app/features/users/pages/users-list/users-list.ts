import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { UsersStore } from '../../../../core/store/users.store';
import { RolesStore } from '../../../../core/store/roles.store';
import { AuthStore } from '../../../../core/store/auth.store';
import { User } from '../../../../core/models/user.model';
import { UserTable } from '../../components/user-table/user-table';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { confirmAction, showSuccess } from '../../../../shared/utils/alert.util';

@Component({ selector: 'app-users-list', imports: [UserTable, EmptyState, ErrorState, PageHeader], templateUrl: './users-list.html' })
export class UsersListPage {
  protected readonly store = inject(UsersStore);
  protected readonly roles = inject(RolesStore);
  protected readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  constructor() {
    void this.store.loadAll();
    void this.roles.loadAll();
  }

  protected showTrash(value: boolean): void { void (value ? this.store.loadSoftDeleted(true) : this.store.loadAll(true)); }
  protected retry(): void { void (this.store.trashView() ? this.store.loadSoftDeleted(true) : this.store.loadAll(true)); }
  protected create(): void { void this.router.navigate(['/admin/users/nuevo']); }
  protected async remove(user: User): Promise<void> {
    if (!(await confirmAction({ title: '¿Eliminar usuario?', text: `"${user.username}" se moverá a la papelera.`, confirmText: 'Sí, eliminar' }))) return;
    if (await this.store.softDelete(user)) showSuccess('Usuario eliminado.');
    else this.store.clearError();
  }
  protected async toggle(user: User): Promise<void> {
    if (await this.store.toggleActive(user)) showSuccess('Estado del usuario actualizado.');
    else this.store.clearError();
  }
  protected async restore(user: User): Promise<void> {
    if (await this.store.restore(user)) showSuccess('Usuario restaurado.');
    else this.store.clearError();
  }
}
