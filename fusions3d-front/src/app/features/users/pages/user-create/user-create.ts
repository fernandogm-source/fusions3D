import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { UsersStore } from '../../../../core/store/users.store';
import { UserPayload } from '../../../../core/models/user.model';
import { UserForm } from '../../components/user-form/user-form';
import { showSuccess } from '../../../../shared/utils/alert.util';

@Component({ selector: 'app-user-create', imports: [UserForm], templateUrl: './user-create.html' })
export class UserCreatePage {
  private readonly store = inject(UsersStore); private readonly router = inject(Router); protected readonly saving = signal(false);
  protected async submit(payload: UserPayload): Promise<void> { this.saving.set(true); try { const user = await this.store.create(payload); if (user) { await this.store.loadById(user._id, true); showSuccess('Usuario creado.'); void this.router.navigate(['/admin/users', user._id]); } } finally { this.saving.set(false); } }
}
