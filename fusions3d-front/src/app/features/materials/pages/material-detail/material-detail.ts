import { Component, DestroyRef, effect, inject, input, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MaterialsStore } from '../../../../core/store/materials.store';
import { ErrorState } from '../../../../shared/components/error-state/error-state';

@Component({ selector: 'app-material-detail', imports: [RouterLink, ErrorState], templateUrl: './material-detail.html' })
export class MaterialDetailPage {
  readonly id = input.required<string>(); protected readonly store = inject(MaterialsStore); protected readonly material = this.store.selected;
  constructor() {
    effect(() => { const id = this.id(); untracked(() => void this.store.loadById(id)); });
    inject(DestroyRef).onDestroy(() => this.store.clearSelected());
  }
  protected retry(): void { void this.store.loadById(this.id()); }
}
