import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { Impresion } from '../../../../core/models/impresion.model';
import { ImpresionsStore } from '../../../../core/store/impresions.store';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { confirmAction, showSuccess } from '../../../../shared/utils/alert.util';
import { ImpresionTable } from '../../components/impresion-table/impresion-table';

/** Página de listado: catálogo de impresiones 3D (vista de administración). */
@Component({
  selector: 'app-impresiones-list',
  imports: [RouterLink, NgxSkeletonLoaderModule, ImpresionTable, EmptyState, ErrorState],
  templateUrl: './impresiones-list.html',
})
export class ImpresionesListPage {
  protected readonly store = inject(ImpresionsStore);
  protected readonly skeletonItems = Array.from({ length: 6 });

  constructor() {
    // Carga una sola vez: el store actúa como caché global
    void this.store.loadAll();
  }

  protected retry(): void {
    this.store.clearError();
    void this.store.loadAll(true);
  }

  protected async delete(impresion: Impresion): Promise<void> {
    const confirmed = await confirmAction({
      title: '¿Eliminar impresión?',
      text: `"${impresion.nombre}" se eliminará (borrado lógico).`,
      confirmText: 'Sí, eliminar',
    });
    if (!confirmed) return;

    const ok = await this.store.softDelete(impresion._id);
    if (ok) {
      showSuccess('La impresión se ha eliminado correctamente.');
    }
  }

  protected async toggleActive(impresion: Impresion): Promise<void> {
    const ok = await this.store.toggleActive(impresion._id);
    if (ok) {
      showSuccess(
        impresion.isActive
          ? 'La impresión se ha desactivado.'
          : 'La impresión se ha activado.',
      );
    }
  }
}
