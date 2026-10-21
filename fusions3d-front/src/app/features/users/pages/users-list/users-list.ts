import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { UsersStore } from '../../../../core/store/users.store';
import { User } from '../../../../core/models/user.model';
import { UserTable } from '../../components/user-table/user-table';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { confirmAction, showError, showSuccess } from '../../../../shared/utils/alert.util';

@Component({ selector: 'app-users-list', imports: [UserTable, EmptyState, ErrorState], templateUrl: './users-list.html' })
export class UsersListPage {
  protected readonly store = inject(UsersStore); private readonly router = inject(Router);
  constructor() { void this.store.loadAll(); }
  protected showTrash(value: boolean): void { void (value ? this.store.loadSoftDeleted(true) : this.store.loadAll(true)); }
  protected retry(): void { void (this.store.trashView() ? this.store.loadSoftDeleted(true) : this.store.loadAll(true)); }
  protected create(): void { void this.router.navigate(['/admin/users/nuevo']); }
  protected async remove(user: User): Promise<void> { if (!(await confirmAction({ title: '¿Eliminar usuario?', text: `"${user.name}" se moverá a la papelera.`, confirmText: 'Sí, eliminar' }))) return; if (await this.store.softDelete(user)) showSuccess('Usuario eliminado.'); }
  protected async toggle(user: User): Promise<void> { if (await this.store.toggleActive(user)) showSuccess('Estado del usuario actualizado.'); else { const message = this.store.error() ?? 'No se pudo cambiar el estado del usuario.'; this.store.clearError(); showError(message); } }
  protected async restore(user: User): Promise<void> { if (await this.store.restore(user)) showSuccess('Usuario restaurado.'); }
}
