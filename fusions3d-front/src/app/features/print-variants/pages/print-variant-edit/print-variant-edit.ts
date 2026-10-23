import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { PrintVariantsStore } from '../../../../core/store/print-variants.store';
import { PrintVariantPayload } from '../../../../core/models/print-variant.model';
import { PrintVariantForm } from '../../components/print-variant-form/print-variant-form';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { showSuccess } from '../../../../shared/utils/alert.util';

@Component({ selector: 'app-print-variant-edit', imports: [PrintVariantForm, ErrorState], templateUrl: './print-variant-edit.html' })
export class PrintVariantEditPage {
  readonly id = input.required<string>(); protected readonly store = inject(PrintVariantsStore); private readonly router = inject(Router);
  protected readonly variant = this.store.selected; protected readonly saving = signal(false);
  constructor() { effect(() => { const id = this.id(); untracked(() => void this.store.loadById(id)); }); }
  protected retry(): void { void this.store.loadById(this.id()); }
  protected async submit(payload: PrintVariantPayload): Promise<void> { this.saving.set(true); try { const variant = await this.store.update(this.id(), payload); if (variant) { showSuccess('Variante actualizada.'); void this.router.navigate(['/admin/print-variants']); } else if (this.store.dependencyUnavailable()) { this.store.clearError(); await this.store.loadAll(true); await this.router.navigate(['/admin/print-variants']); } else this.store.clearError(); } finally { this.saving.set(false); } }
}
