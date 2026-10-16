import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CategoriesService } from '../../../../core/services/categories.service';
import { Category, PrintCategory } from '../../../../core/models/category.model';
import {
  Impresion,
  ImpresionCreatePayload,
  ImpresionStatus,
} from '../../../../core/models/impresion.model';
import {
  getControlErrorMessage,
} from '../../../../shared/utils/custom-validators';
import { showError } from '../../../../shared/utils/alert.util';

/**
 * Formulario reutilizable (Reactive Forms) para crear y editar impresiones.
 * - `initialValue`: valores iniciales (modo edición).
 * - `formSubmit`: emite el payload validado.
 */
@Component({
  selector: 'app-impresion-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './impresion-form.html',
})
export class ImpresionForm {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly categoriesService = inject(CategoriesService);

  readonly initialValue = input<Impresion | null>(null);
  readonly submitLabel = input('Crear impresión');
  readonly cancelUrl = input<string>('/impresiones');
  readonly submitting = input(false);
  /** En edición se permite además el estado "suspended" */
  readonly isEdit = input(false);

  readonly formSubmit = output<ImpresionCreatePayload>();
  protected readonly categories = signal<PrintCategory[]>([]);

  protected readonly statusOptions = computed<{ value: ImpresionStatus; label: string }[]>(() => {
    const base = [
      { value: 'draft' as ImpresionStatus, label: 'Borrador' },
      { value: 'published' as ImpresionStatus, label: 'Publicado' },
      { value: 'archived' as ImpresionStatus, label: 'Archivado' },
    ];
    return this.isEdit() ? [...base, { value: 'suspended' as ImpresionStatus, label: 'Suspendido' }] : base;
  });

  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
    description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]],
    categoryId: ['', [Validators.required]],
    status: ['draft' as ImpresionStatus, [Validators.required]],
  });

  constructor() {
    void firstValueFrom(this.categoriesService.getActive())
      .then((categories: Category[]) => this.categories.set(categories))
      .catch(() => showError('No se pudieron cargar las categorías.'));

    // Cuando llega el valor inicial (p. ej. carga asíncrona en edición),
    // rellenamos el formulario.
    effect(() => {
      const value = this.initialValue();
      if (value) {
        this.form.patchValue({
          name: value.name,
          description: value.description,
          categoryId: typeof value.categoryId === 'string' ? value.categoryId : value.categoryId?._id ?? '',
          status: value.status,
        });
      }
    });
  }

  protected hasError(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  protected errorMessage(controlName: string, label: string): string | null {
    return getControlErrorMessage(this.form.get(controlName), label);
  }

  protected onSubmit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();

    const payload: ImpresionCreatePayload = {
      name: raw.name.trim(),
      description: raw.description.trim(),
      categoryId: raw.categoryId,
      status: raw.status,
    };

    this.formSubmit.emit(payload);
  }
}
