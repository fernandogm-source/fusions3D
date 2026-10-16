import { Component, DestroyRef, effect, inject, input, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UsersStore } from '../../../../core/store/users.store';
import { ErrorState } from '../../../../shared/components/error-state/error-state';

@Component({ selector: 'app-user-detail', imports: [RouterLink, ErrorState], templateUrl: './user-detail.html' })
export class UserDetailPage {
  readonly id = input.required<string>(); protected readonly store = inject(UsersStore); protected readonly user = this.store.selected;
  constructor() {
    effect(() => { const id = this.id(); untracked(() => void this.store.loadById(id)); });
    inject(DestroyRef).onDestroy(() => this.store.clearSelected());
  }
  protected retry(): void { void this.store.loadById(this.id()); }
  protected roleName(role: string | { name: string }): string { return typeof role === 'string' ? role : role.name; }
}
