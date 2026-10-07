import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { ImpresionCreatePayload } from '../../../../core/models/impresion.model';
import { ImpresionsStore } from '../../../../core/store/impresions.store';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { showSuccess } from '../../../../shared/utils/alert.util';
import { ImpresionForm } from '../../components/impresion-form/impresion-form';

/** Página de edición de una impresión existente (identificada por slug). */
@Component({
  selector: 'app-impresion-edit',
  imports: [ImpresionForm, ErrorState],
  template: `
    <div class="mb-8">
      <h1 class="text-3xl font-extrabold tracking-tight text-slate-100">
        Editar <span class="text-[#ff6000]">impresión</span>
      </h1>
      <p class="mt-1 text-sm text-slate-400">Modifica los datos de la pieza y guarda los cambios.</p>
    </div>

    @if (store.hasError() && !store.selectedImpresion()) {
      <app-error-state
        title="No se ha podido cargar la impresión"
        [message]="store.error() ?? 'Error desconocido'"
        (retry)="retry()"
      />
    } @else {
      <app-impresion-form
        submitLabel="Guardar cambios"
        [isEdit]="true"
        [initialValue]="store.selectedImpresion()"
        [submitting]="submitting()"
        [cancelUrl]="store.selectedImpresion() ? '/impresiones/' + store.selectedImpresion()!.slug : '/impresiones'"
        (formSubmit)="onSubmit($event)"
      />
    }
  `,
})
export class ImpresionEditPage {
  /** Slug recibido desde la ruta gracias a withComponentInputBinding */
  readonly slug = input.required<string>();

  protected readonly store = inject(ImpresionsStore);
  private readonly router = inject(Router);

  protected readonly submitting = signal(false);

  constructor() {
    effect(() => {
      const slug = this.slug();
      untracked(() => void this.store.loadBySlug(slug));
    });
  }

  protected retry(): void {
    this.store.clearError();
    void this.store.loadBySlug(this.slug());
  }

  protected async onSubmit(payload: ImpresionCreatePayload): Promise<void> {
    const current = this.store.selectedImpresion();
    if (!current || this.submitting()) return;

    this.submitting.set(true);

    try {
      const updated = await this.store.update(current._id, payload);
      if (updated) {
        showSuccess(`"${updated.nombre}" se ha actualizado correctamente.`);
        // El backend regenera el slug si cambia el nombre
        void this.router.navigate(['/impresiones', updated.slug]);
      }
    } finally {
      this.submitting.set(false);
    }
  }
}
