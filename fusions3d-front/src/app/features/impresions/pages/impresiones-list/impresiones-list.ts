import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Impresion } from '../../../../core/models/impresion.model';
import { ImpresionsStore } from '../../../../core/store/impresions.store';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { TableSkeleton } from '../../../../shared/components/skeleton/table-skeleton/table-skeleton';
import { confirmAction, showSuccess } from '../../../../shared/utils/alert.util';
import { ImpresionTable } from '../../components/impresion-table/impresion-table';

/** Página de listado: catálogo de impresiones 3D (vista de administración). */
@Component({
  selector: 'app-impresiones-list',
  imports: [RouterLink, TableSkeleton, ImpresionTable, EmptyState, ErrorState, PageHeader],
  templateUrl: './impresiones-list.html',
})
export class ImpresionesListPage {
  protected readonly store = inject(ImpresionsStore);
  protected readonly trashView = signal(false);

  constructor() {
    // Carga una sola vez: el store actúa como caché global
    void this.store.loadAll();
  }

  protected retry(): void {
    this.store.clearError();
    void (this.trashView() ? this.store.loadSoftDeleted(true) : this.store.loadAll(true));
  }

  protected setTrashView(value: boolean): void {
    this.trashView.set(value);
    void (value ? this.store.loadSoftDeleted(true) : this.store.loadAll(true));
  }

  protected async delete(impresion: Impresion): Promise<void> {
    const confirmed = await confirmAction({
      title: '¿Eliminar impresión?',
      text: `"${impresion.name}" se eliminará (borrado lógico).`,
      confirmText: 'Sí, eliminar',
    });
    if (!confirmed) return;

    const ok = await this.store.softDelete(impresion._id);
    if (ok) {
      showSuccess('La impresión se ha eliminado correctamente.');
    } else this.store.clearError();
  }

  protected async toggleActive(impresion: Impresion): Promise<void> {
    const ok = await this.store.toggleActive(impresion._id);
    if (ok) {
      showSuccess(
        impresion.isActive
          ? 'La impresión se ha desactivado.'
          : 'La impresión se ha activado.',
      );
    } else this.store.clearError();
  }

  protected async restore(impresion: Impresion): Promise<void> {
    const ok = await this.store.restore(impresion._id);
    if (ok) showSuccess(`"${impresion.name}" se ha restaurado correctamente.`);
    else this.store.clearError();
  }
}
