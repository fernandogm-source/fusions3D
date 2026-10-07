import { CurrencyPipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Impresion, ImpresionStatus } from '../../../../core/models/impresion.model';
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

/** Tabla de impresiones para el panel de administración. */
@Component({
  selector: 'app-impresion-table',
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './impresion-table.html',
})
export class ImpresionTable {
  readonly impresions = input.required<Impresion[]>();
  readonly delete = output<Impresion>();
  readonly toggleActive = output<Impresion>();

  protected readonly statusLabels = STATUS_LABELS;
  protected readonly statusClasses = STATUS_CLASSES;

  protected imageUrl(impresion: Impresion): string {
    return impresion.imagen ?? placeholderImage(impresion.slug, impresion.nombre);
  }

  protected formatTiempo = formatTiempoImpresion;
}
