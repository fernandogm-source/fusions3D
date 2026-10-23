import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { MaterialsStore } from '../../../../core/store/materials.store';
import { MaterialPayload } from '../../../../core/models/material.model';
import { MaterialForm } from '../../components/material-form/material-form';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { showSuccess } from '../../../../shared/utils/alert.util';

@Component({ selector: 'app-material-edit', imports: [MaterialForm, ErrorState], templateUrl: './material-edit.html' })
export class MaterialEditPage {
  readonly id = input.required<string>(); protected readonly store = inject(MaterialsStore); private readonly router = inject(Router);
  protected readonly material = this.store.selected; protected readonly saving = signal(false);
  constructor() { effect(() => { const id = this.id(); untracked(() => void this.store.loadById(id)); }); }
  protected retry(): void { void this.store.loadById(this.id()); }
  protected async submit(payload: MaterialPayload): Promise<void> { this.saving.set(true); try { const item = await this.store.update(this.id(), payload); if (item) { showSuccess('Material actualizado.'); void this.router.navigate(['/admin/materials']); } else this.store.clearError(); } finally { this.saving.set(false); } }
}
