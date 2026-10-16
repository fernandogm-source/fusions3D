import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Impresion, ImpresionStatus } from '../../../../core/models/impresion.model';
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

/** Tabla de impresiones para el panel de administración. */
@Component({
  selector: 'app-impresion-table',
  imports: [RouterLink],
  templateUrl: './impresion-table.html',
})
export class ImpresionTable {
  readonly impresions = input.required<Impresion[]>();
  readonly deletedMode = input(false);
  readonly delete = output<Impresion>();
  readonly toggleActive = output<Impresion>();
  readonly restore = output<Impresion>();

  protected readonly statusLabels = STATUS_LABELS;
  protected readonly statusClasses = STATUS_CLASSES;

  protected imageUrl(impresion: Impresion): string {
    return impresion.images?.find((image) => image.isCover)?.imageUrl
      ?? impresion.images?.[0]?.imageUrl
      ?? placeholderImage(impresion.slug, impresion.name);
  }

  protected hasPhoto(impresion: Impresion): boolean {
    return (impresion.images?.length ?? 0) > 0;
  }
}
