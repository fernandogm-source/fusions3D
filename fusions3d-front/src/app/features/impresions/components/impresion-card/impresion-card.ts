import { Component, computed, input } from '@angular/core';
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

/** Card de impresión: imagen, título y datos básicos. */
@Component({
  selector: 'app-impresion-card',
  imports: [RouterLink],
  templateUrl: './impresion-card.html',
})
export class ImpresionCard {
  readonly impresion = input.required<Impresion>();

  protected readonly imageUrl = computed(
    () => this.impresion().images?.find((image) => image.isCover)?.imageUrl
      ?? this.impresion().images?.[0]?.imageUrl
      ?? placeholderImage(this.impresion().slug, this.impresion().name),
  );
  protected readonly hasPhoto = computed(() => (this.impresion().images?.length ?? 0) > 0);
  protected readonly statusLabel = computed(() => STATUS_LABELS[this.impresion().status] ?? this.impresion().status);
  protected readonly statusClass = computed(() => STATUS_CLASSES[this.impresion().status] ?? STATUS_CLASSES.draft);
}
