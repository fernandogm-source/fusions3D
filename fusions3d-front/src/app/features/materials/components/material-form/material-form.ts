import { Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Material, MaterialPayload } from '../../../../core/models/material.model';

@Component({ selector: 'app-material-form', imports: [ReactiveFormsModule, RouterLink], templateUrl: './material-form.html' })
export class MaterialForm {
  private readonly fb = inject(FormBuilder).nonNullable;
  readonly initialValue = input<Material | null>(null);
  readonly submitLabel = input('Guardar material');
  readonly cancelUrl = input('/admin/materials');
  readonly submitting = input(false);
  readonly formSubmit = output<MaterialPayload>();
  protected readonly form = this.fb.group({ name: ['', [Validators.required, Validators.maxLength(50)]] });
  constructor() { effect(() => { const material = this.initialValue(); if (material) this.form.patchValue({ name: material.name }); }); }
  protected submit(): void {
    if (this.form.invalid || this.submitting()) { this.form.markAllAsTouched(); return; }
    this.formSubmit.emit({ name: this.form.controls.name.value.trim() });
  }
}
