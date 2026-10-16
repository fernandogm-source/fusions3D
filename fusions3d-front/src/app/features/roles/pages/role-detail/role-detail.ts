import { Component, DestroyRef, effect, inject, input, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RolesStore } from '../../../../core/store/roles.store';
import { ErrorState } from '../../../../shared/components/error-state/error-state';

@Component({ selector: 'app-role-detail', imports: [RouterLink, ErrorState], templateUrl: './role-detail.html' })
export class RoleDetailPage {
  readonly id = input.required<string>(); protected readonly store = inject(RolesStore); protected readonly role = this.store.selected;
  constructor() {
    effect(() => { const id = this.id(); untracked(() => void this.store.loadById(id)); });
    inject(DestroyRef).onDestroy(() => this.store.clearSelected());
  }
  protected retry(): void { void this.store.loadById(this.id()); }
}
