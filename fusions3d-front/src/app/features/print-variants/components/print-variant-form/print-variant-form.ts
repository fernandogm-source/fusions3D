import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { PrintVariant, PrintVariantPayload } from '../../../../core/models/print-variant.model';
import { Impresion } from '../../../../core/models/impresion.model';
import { Material } from '../../../../core/models/material.model';
import { ImpresionesService } from '../../../../core/services/impresiones.service';
import { MaterialsService } from '../../../../core/services/materials.service';
import { showError } from '../../../../shared/utils/alert.util';

@Component({ selector: 'app-print-variant-form', imports: [ReactiveFormsModule, RouterLink], templateUrl: './print-variant-form.html' })
export class PrintVariantForm {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly printsService = inject(ImpresionesService);
  private readonly materialsService = inject(MaterialsService);
  readonly initialValue = input<PrintVariant | null>(null);
  readonly submitLabel = input('Guardar variante');
  readonly cancelUrl = input('/admin/print-variants');
  readonly submitting = input(false);
  readonly formSubmit = output<PrintVariantPayload>();
  protected readonly prints = signal<Impresion[]>([]);
  protected readonly materials = signal<Material[]>([]);
  protected readonly form = this.fb.group({
    printId: ['', Validators.required],
    name: ['', [Validators.required, Validators.maxLength(150)]], materialId: ['', Validators.required],
    color: ['', [Validators.required, Validators.maxLength(100)]], salePrice: [0, [Validators.required, Validators.min(0)]],
    costPrice: [0, [Validators.required, Validators.min(0)]], printTime: [0, [Validators.required, Validators.min(0)]],
  });

  constructor() {
    void Promise.all([firstValueFrom(this.printsService.getActive()), firstValueFrom(this.materialsService.getActive())])
      .then(([prints, materials]) => { this.prints.set(prints); this.materials.set(materials); })
      .catch(() => showError('No se pudieron cargar impresiones y materiales para el formulario.'));
    effect(() => {
      const value = this.initialValue();
      if (value) this.form.patchValue({
        printId: this.referenceId(value.printId), name: value.name,
        materialId: this.referenceId(value.materialId), color: value.color,
        salePrice: value.salePrice, costPrice: value.costPrice, printTime: value.printTime,
      });
    });
  }

  private referenceId(value: string | { _id: string }): string { return typeof value === 'string' ? value : value._id; }
  protected submit(): void {
    if (this.form.invalid || this.submitting()) { this.form.markAllAsTouched(); return; }
    const value = this.form.getRawValue();
    this.formSubmit.emit({ ...value, name: value.name.trim(), color: value.color.trim() });
  }
}
