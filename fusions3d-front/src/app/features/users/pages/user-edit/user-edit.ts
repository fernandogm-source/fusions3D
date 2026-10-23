import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { UsersStore } from '../../../../core/store/users.store';
import { UserPayload } from '../../../../core/models/user.model';
import { UserForm } from '../../components/user-form/user-form';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { showSuccess } from '../../../../shared/utils/alert.util';

@Component({ selector: 'app-user-edit', imports: [UserForm, ErrorState], templateUrl: './user-edit.html' })
export class UserEditPage {
  readonly id = input.required<string>(); protected readonly store = inject(UsersStore); private readonly router = inject(Router);
  protected readonly user = this.store.selected; protected readonly saving = signal(false);
  constructor() { effect(() => { const id = this.id(); untracked(() => void this.store.loadById(id)); }); }
  protected retry(): void { void this.store.loadById(this.id()); }
  protected async submit(payload: UserPayload): Promise<void> { this.saving.set(true); try { const user = await this.store.update(this.id(), payload); if (user) { showSuccess('Usuario actualizado.'); void this.router.navigate(['/admin/users']); } else if (this.store.dependencyUnavailable()) { this.store.clearError(); await this.store.loadAll(true); await this.router.navigate(['/admin/users']); } else this.store.clearError(); } finally { this.saving.set(false); } }
}
