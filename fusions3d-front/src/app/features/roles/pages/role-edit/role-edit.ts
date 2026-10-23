import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { RolesStore } from '../../../../core/store/roles.store';
import { RolePayload } from '../../../../core/models/role.model';
import { RoleForm } from '../../components/role-form/role-form';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { showSuccess } from '../../../../shared/utils/alert.util';

@Component({ selector: 'app-role-edit', imports: [RoleForm, ErrorState], templateUrl: './role-edit.html' })
export class RoleEditPage {
  readonly id = input.required<string>(); protected readonly store = inject(RolesStore); private readonly router = inject(Router);
  protected readonly role = this.store.selected; protected readonly saving = signal(false);
  constructor() { effect(() => { const id = this.id(); untracked(() => void this.store.loadById(id)); }); }
  protected retry(): void { void this.store.loadById(this.id()); }
  protected async submit(payload: RolePayload): Promise<void> { this.saving.set(true); try { const role = await this.store.update(this.id(), payload); if (role) { showSuccess('Rol actualizado.'); void this.router.navigate(['/admin/roles']); } else this.store.clearError(); } finally { this.saving.set(false); } }
}
