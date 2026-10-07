import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ImpresionCreatePayload } from '../../../../core/models/impresion.model';
import { ImpresionsStore } from '../../../../core/store/impresions.store';
import { showSuccess } from '../../../../shared/utils/alert.util';
import { ImpresionForm } from '../../components/impresion-form/impresion-form';

/** Página de creación de una nueva impresión. */
@Component({
  selector: 'app-impresion-create',
  imports: [ImpresionForm],
  template: `
    <div class="mb-8">
      <h1 class="text-3xl font-extrabold tracking-tight text-slate-100">
        Nueva <span class="text-[#ff6000]">impresión</span>
      </h1>
      <p class="mt-1 text-sm text-slate-400">Rellena los datos para publicar una nueva pieza en el catálogo.</p>
    </div>

    <app-impresion-form
      submitLabel="Crear impresión"
      [submitting]="submitting()"
      (formSubmit)="onSubmit($event)"
    />
  `,
})
export class ImpresionCreatePage {
  private readonly store = inject(ImpresionsStore);
  private readonly router = inject(Router);

  protected readonly submitting = signal(false);

  protected async onSubmit(payload: ImpresionCreatePayload): Promise<void> {
    this.submitting.set(true);

    try {
      const created = await this.store.create(payload);
      if (created) {
        showSuccess(`"${created.nombre}" se ha creado correctamente.`);
        void this.router.navigate(['/impresiones', created.slug]);
      }
    } finally {
      this.submitting.set(false);
    }
  }
}
