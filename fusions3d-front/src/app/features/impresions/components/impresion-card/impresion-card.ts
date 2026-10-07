import { CurrencyPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
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

/** Card de impresión: imagen, título, precio y datos básicos. */
@Component({
  selector: 'app-impresion-card',
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './impresion-card.html',
})
export class ImpresionCard {
  readonly impresion = input.required<Impresion>();

  protected readonly imageUrl = computed(
    () => this.impresion().imagen ?? placeholderImage(this.impresion().slug, this.impresion().nombre),
  );
  protected readonly statusLabel = computed(() => STATUS_LABELS[this.impresion().status] ?? this.impresion().status);
  protected readonly statusClass = computed(() => STATUS_CLASSES[this.impresion().status] ?? STATUS_CLASSES.draft);
  protected readonly tiempoImpresion = computed(() => formatTiempoImpresion(this.impresion().tiempo_impresion));
}
