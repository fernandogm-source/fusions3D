import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { PrintVariantsStore } from '../../../../core/store/print-variants.store';
import { PrintVariant } from '../../../../core/models/print-variant.model';
import { PrintVariantTable } from '../../components/print-variant-table/print-variant-table';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { confirmAction, showError, showSuccess } from '../../../../shared/utils/alert.util';

@Component({ selector: 'app-print-variants-list', imports: [PrintVariantTable, EmptyState, ErrorState], templateUrl: './print-variants-list.html' })
export class PrintVariantsListPage {
  protected readonly store = inject(PrintVariantsStore); private readonly router = inject(Router);
  constructor() { void this.store.loadAll(); }
  protected showTrash(value: boolean): void { void (value ? this.store.loadSoftDeleted(true) : this.store.loadAll(true)); }
  protected retry(): void { void (this.store.trashView() ? this.store.loadSoftDeleted(true) : this.store.loadAll(true)); }
  protected create(): void { void this.router.navigate(['/admin/print-variants/nueva']); }
  protected async remove(variant: PrintVariant): Promise<void> { if (!(await confirmAction({ title: '¿Eliminar variante?', text: `La variante ${variant.sku} se moverá a la papelera.`, confirmText: 'Sí, eliminar' }))) return; if (await this.store.softDelete(variant)) showSuccess('Variante eliminada.'); }
  protected async toggle(variant: PrintVariant): Promise<void> { if (await this.store.toggleActive(variant)) showSuccess('Estado de la variante actualizado.'); else { const message = this.store.error() ?? 'No se pudo cambiar el estado de la variante.'; this.store.clearError(); showError(message); } }
  protected async restore(variant: PrintVariant): Promise<void> { if (await this.store.restore(variant)) showSuccess('Variante restaurada.'); }
}
