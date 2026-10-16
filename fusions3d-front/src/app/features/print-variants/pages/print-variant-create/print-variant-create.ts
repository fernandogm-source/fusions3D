import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { PrintVariantsStore } from '../../../../core/store/print-variants.store';
import { PrintVariantPayload } from '../../../../core/models/print-variant.model';
import { PrintVariantForm } from '../../components/print-variant-form/print-variant-form';
import { showSuccess } from '../../../../shared/utils/alert.util';

@Component({ selector: 'app-print-variant-create', imports: [PrintVariantForm], templateUrl: './print-variant-create.html' })
export class PrintVariantCreatePage {
  private readonly store = inject(PrintVariantsStore); private readonly router = inject(Router); protected readonly saving = signal(false);
  protected async submit(payload: PrintVariantPayload): Promise<void> { this.saving.set(true); try { const variant = await this.store.create(payload); if (variant) { await this.store.loadById(variant._id, true); showSuccess('Variante creada.'); void this.router.navigate(['/admin/print-variants', variant._id]); } } finally { this.saving.set(false); } }
}
