import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, effect, inject, input, signal, untracked } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { ImpresionStatus } from '../../../../core/models/impresion.model';
import { ImpresionsStore } from '../../../../core/store/impresions.store';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { confirmAction, showSuccess } from '../../../../shared/utils/alert.util';
import { formatTiempoImpresion } from '../../../../shared/utils/format.util';
import { placeholderImage } from '../../../../shared/utils/placeholder-image.util';

const STATUS_LABELS: Record<ImpresionStatus, string> = {
  published: 'Publicado',
  draft: 'Borrador',
  archived: 'Archivado',
  suspended: 'Suspendido',
};

const STATUS_CLASSES: Record<ImpresionStatus, string> = {
  published: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30',
  draft: 'bg-amber-500/15 text-amber-400 ring-amber-500/30',
  archived: 'bg-slate-500/15 text-slate-400 ring-slate-500/30',
  suspended: 'bg-red-500/15 text-red-400 ring-red-500/30',
};

/** Página de detalle de una impresión (ruta identificada por slug). */
@Component({
  selector: 'app-impresion-detail',
  imports: [RouterLink, CurrencyPipe, DatePipe, NgxSkeletonLoaderModule, ErrorState],
  templateUrl: './impresion-detail.html',
})
export class ImpresionDetailPage {
  /** Slug recibido desde la ruta gracias a withComponentInputBinding */
  readonly slug = input.required<string>();

  protected readonly store = inject(ImpresionsStore);
  private readonly router = inject(Router);

  protected readonly processing = signal(false);

  protected readonly imageUrl = computed(() => {
    const impresion = this.store.selectedImpresion();
    return impresion ? (impresion.imagen ?? placeholderImage(impresion.slug, impresion.nombre)) : '';
  });

  protected readonly statusLabel = computed(() => {
    const status = this.store.selectedImpresion()?.status;
    return status ? STATUS_LABELS[status] : '';
  });

  protected readonly statusClass = computed(() => {
    const status = this.store.selectedImpresion()?.status;
    return status ? STATUS_CLASSES[status] : '';
  });

  constructor() {
    // Carga la impresión cuando cambia el slug de la ruta
    effect(() => {
      const slug = this.slug();
      untracked(() => void this.store.loadBySlug(slug));
    });

    // Limpia la selección al salir de la página
    inject(DestroyRef).onDestroy(() => this.store.clearSelected());
  }

  protected formatTiempo = formatTiempoImpresion;

  protected retry(): void {
    this.store.clearError();
    void this.store.loadBySlug(this.slug());
  }

  protected async toggleActive(): Promise<void> {
    const impresion = this.store.selectedImpresion();
    if (!impresion || this.processing()) return;

    this.processing.set(true);
    try {
      const ok = await this.store.toggleActive(impresion._id);
      if (ok) {
        showSuccess(
          impresion.isActive ? 'La impresión se ha desactivado.' : 'La impresión se ha activado.',
        );
      }
    } finally {
      this.processing.set(false);
    }
  }

  protected async delete(): Promise<void> {
    const impresion = this.store.selectedImpresion();
    if (!impresion || this.processing()) return;

    const confirmed = await confirmAction({
      title: '¿Eliminar impresión?',
      text: `"${impresion.nombre}" se eliminará (borrado lógico).`,
      confirmText: 'Sí, eliminar',
    });
    if (!confirmed) return;

    this.processing.set(true);
    try {
      const ok = await this.store.softDelete(impresion._id);
      if (ok) {
        showSuccess('La impresión se ha eliminado correctamente.');
        void this.router.navigate(['/impresiones']);
      }
    } finally {
      this.processing.set(false);
    }
  }
}
