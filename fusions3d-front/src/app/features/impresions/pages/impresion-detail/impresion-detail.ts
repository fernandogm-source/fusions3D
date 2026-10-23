import { DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, effect, inject, input, signal, untracked } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ImpresionStatus } from '../../../../core/models/impresion.model';
import { ImpresionsStore } from '../../../../core/store/impresions.store';
import { DetailSkeleton } from '../../../../shared/components/skeleton/detail-skeleton/detail-skeleton';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { confirmAction, showSuccess } from '../../../../shared/utils/alert.util';
import { placeholderImage } from '../../../../shared/utils/placeholder-image.util';

const STATUS_LABELS: Record<ImpresionStatus, string> = {
  published: 'Publicado',
  draft: 'Borrador',
  archived: 'Archivado',
  suspended: 'Suspendido',
};

const STATUS_CLASSES: Record<ImpresionStatus, string> = {
  published: 'badge-success',
  draft: 'badge-warning',
  archived: 'badge-muted',
  suspended: 'badge-danger',
};

/** Página de detalle de una impresión (ruta identificada por slug). */
@Component({
  selector: 'app-impresion-detail',
  imports: [RouterLink, DatePipe, DetailSkeleton, ErrorState],
  templateUrl: './impresion-detail.html',
})
export class ImpresionDetailPage {
  /** Slug recibido desde la ruta gracias a withComponentInputBinding */
  readonly slug = input.required<string>();

  protected readonly store = inject(ImpresionsStore);
  private readonly router = inject(Router);

  protected readonly processing = signal(false);

  protected readonly images = computed(() => {
    const impresion = this.store.selectedImpresion();
    return [...(impresion?.images ?? [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  });
  protected readonly activeImageIndex = signal(0);
  protected readonly imageUrl = computed(() => {
    const impresion = this.store.selectedImpresion();
    const images = this.images();
    const coverIndex = images.findIndex((image) => image.isCover);
    const selectedIndex = images.length > 0
      ? (this.activeImageIndex() < images.length ? this.activeImageIndex() : 0)
      : -1;
    const image = images[selectedIndex >= 0 ? selectedIndex : coverIndex];
    return impresion
      ? (image?.imageUrl ?? placeholderImage(impresion.slug, impresion.name))
      : '';
  });

  protected readonly hasPhoto = computed(
    () => (this.store.selectedImpresion()?.images?.length ?? 0) > 0,
  );

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

    effect(() => {
      const images = this.store.selectedImpresion()?.images ?? [];
      const coverIndex = images.findIndex((image) => image.isCover);
      this.activeImageIndex.set(coverIndex >= 0 ? coverIndex : 0);
    });

    // Limpia la selección al salir de la página
    inject(DestroyRef).onDestroy(() => this.store.clearSelected());
  }

  protected retry(): void {
    this.store.clearError();
    void this.store.loadBySlug(this.slug());
  }

  protected previousImage(): void {
    const count = this.images().length;
    if (count > 1) this.activeImageIndex.update((index) => (index - 1 + count) % count);
  }

  protected nextImage(): void {
    const count = this.images().length;
    if (count > 1) this.activeImageIndex.update((index) => (index + 1) % count);
  }

  protected selectImage(index: number): void {
    this.activeImageIndex.set(index);
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
      } else this.store.clearError();
    } finally {
      this.processing.set(false);
    }
  }

  protected async delete(): Promise<void> {
    const impresion = this.store.selectedImpresion();
    if (!impresion || this.processing()) return;

    const confirmed = await confirmAction({
      title: '¿Eliminar impresión?',
      text: `"${impresion.name}" se eliminará (borrado lógico).`,
      confirmText: 'Sí, eliminar',
    });
    if (!confirmed) return;

    this.processing.set(true);
    try {
      const ok = await this.store.softDelete(impresion._id);
      if (ok) {
        showSuccess('La impresión se ha eliminado correctamente.');
        void this.router.navigate(['/impresiones']);
      } else this.store.clearError();
    } finally {
      this.processing.set(false);
    }
  }
}
