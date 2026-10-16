import { Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Category, CategoryPayload, CategoryStatus } from '../../../../core/models/category.model';

@Component({
  selector: 'app-category-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './category-form.html',
})
export class CategoryForm {
  private readonly fb = inject(FormBuilder).nonNullable;
  readonly initialValue = input<Category | null>(null);
  readonly submitLabel = input('Guardar categoría');
  readonly cancelUrl = input('/admin/categories');
  readonly submitting = input(false);
  readonly formSubmit = output<CategoryPayload>();

  protected readonly statuses: { value: CategoryStatus; label: string }[] = [
    { value: 'draft', label: 'Borrador' },
    { value: 'published', label: 'Publicada' },
    { value: 'archived', label: 'Archivada' },
    { value: 'suspended', label: 'Suspendida' },
  ];
  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    status: ['draft' as CategoryStatus, Validators.required],
  });

  constructor() {
    effect(() => {
      const category = this.initialValue();
      if (category) this.form.patchValue({ name: category.name, status: category.status });
    });
  }

  protected submit(): void {
    if (this.form.invalid || this.submitting()) { this.form.markAllAsTouched(); return; }
    const value = this.form.getRawValue();
    this.formSubmit.emit({ name: value.name.trim(), status: value.status });
  }
}
