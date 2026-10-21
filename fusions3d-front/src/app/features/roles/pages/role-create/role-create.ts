import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { RolesStore } from '../../../../core/store/roles.store';
import { RolePayload } from '../../../../core/models/role.model';
import { RoleForm } from '../../components/role-form/role-form';
import { showSuccess } from '../../../../shared/utils/alert.util';

@Component({ selector: 'app-role-create', imports: [RoleForm], templateUrl: './role-create.html' })
export class RoleCreatePage {
  private readonly store = inject(RolesStore); private readonly router = inject(Router); protected readonly saving = signal(false);
  protected async submit(payload: RolePayload): Promise<void> { this.saving.set(true); try { const role = await this.store.create(payload); if (role) { showSuccess('Rol creado.'); void this.router.navigate(['/admin/roles']); } } finally { this.saving.set(false); } }
}
