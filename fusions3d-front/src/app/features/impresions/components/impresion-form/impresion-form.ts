import { Component, computed, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  Impresion,
  ImpresionCreatePayload,
  ImpresionStatus,
} from '../../../../core/models/impresion.model';
import {
  getControlErrorMessage,
  positiveNumberValidator,
  urlValidator,
} from '../../../../shared/utils/custom-validators';

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

  readonly initialValue = input<Impresion | null>(null);
  readonly submitLabel = input('Crear impresión');
  readonly cancelUrl = input<string>('/impresiones');
  readonly submitting = input(false);
  /** En edición se permite además el estado "suspended" */
  readonly isEdit = input(false);

  readonly formSubmit = output<ImpresionCreatePayload>();

  protected readonly statusOptions = computed<{ value: ImpresionStatus; label: string }[]>(() => {
    const base = [
      { value: 'draft' as ImpresionStatus, label: 'Borrador' },
      { value: 'published' as ImpresionStatus, label: 'Publicado' },
      { value: 'archived' as ImpresionStatus, label: 'Archivado' },
    ];
    return this.isEdit() ? [...base, { value: 'suspended' as ImpresionStatus, label: 'Suspendido' }] : base;
  });

  protected readonly form = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
    descripcion: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]],
    precio_venta: [null as number | null, [Validators.required, positiveNumberValidator()]],
    precio_coste: [null as number | null, [Validators.required, Validators.min(0)]],
    tiempo_impresion: [null as number | null, [Validators.required, Validators.min(0)]],
    status: ['draft' as ImpresionStatus, [Validators.required]],
    imagen: ['', [urlValidator()]],
  });

  constructor() {
    // Cuando llega el valor inicial (p. ej. carga asíncrona en edición),
    // rellenamos el formulario.
    effect(() => {
      const value = this.initialValue();
      if (value) {
        this.form.patchValue({
          nombre: value.nombre,
          descripcion: value.descripcion,
          precio_venta: value.precio_venta,
          precio_coste: value.precio_coste,
          tiempo_impresion: value.tiempo_impresion,
          status: value.status,
          imagen: value.imagen ?? '',
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
      nombre: raw.nombre.trim(),
      descripcion: raw.descripcion.trim(),
      precio_venta: Number(raw.precio_venta),
      precio_coste: Number(raw.precio_coste),
      tiempo_impresion: Number(raw.tiempo_impresion),
      status: raw.status,
    };

    const imagen = raw.imagen.trim();
    if (imagen) {
      payload.imagen = imagen;
    }

    this.formSubmit.emit(payload);
  }
}
