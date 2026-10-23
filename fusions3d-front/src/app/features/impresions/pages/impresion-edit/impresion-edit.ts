import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { ImpresionCreatePayload } from '../../../../core/models/impresion.model';
import { ImpresionsStore } from '../../../../core/store/impresions.store';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { showSuccess } from '../../../../shared/utils/alert.util';
import { ImpresionForm } from '../../components/impresion-form/impresion-form';

/** Página de edición de una impresión existente (identificada por ID). */
@Component({
  selector: 'app-impresion-edit',
  imports: [ImpresionForm, ErrorState],
  templateUrl: './impresion-edit.html',
})
export class ImpresionEditPage {
  /** ID recibido desde la ruta gracias a withComponentInputBinding */
  readonly id = input.required<string>();

  protected readonly store = inject(ImpresionsStore);
  private readonly router = inject(Router);

  protected readonly submitting = signal(false);

  constructor() {
    effect(() => {
      const id = this.id();
      untracked(() => void this.store.loadById(id));
    });
  }

  protected retry(): void {
    this.store.clearError();
    void this.store.loadById(this.id());
  }

  protected async onSubmit(payload: ImpresionCreatePayload): Promise<void> {
    const current = this.store.selectedImpresion();
    if (!current || this.submitting()) return;

    this.submitting.set(true);

    try {
      const updated = await this.store.update(current._id, payload);
      if (updated) {
        showSuccess(`"${updated.name}" se ha actualizado correctamente.`);
        // El backend regenera el slug si cambia el nombre
        void this.router.navigate(['/impresiones']);
      } else if (this.store.dependencyUnavailable()) {
        this.store.clearError();
        await this.store.loadAll(true);
        await this.router.navigate(['/impresiones']);
      } else this.store.clearError();
    } finally {
      this.submitting.set(false);
    }
  }
}
