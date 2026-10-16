import { Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Role, RolePayload } from '../../../../core/models/role.model';

@Component({ selector: 'app-role-form', imports: [ReactiveFormsModule, RouterLink], templateUrl: './role-form.html' })
export class RoleForm {
  private readonly fb = inject(FormBuilder).nonNullable;
  readonly initialValue = input<Role | null>(null);
  readonly submitLabel = input('Guardar rol');
  readonly cancelUrl = input('/admin/roles');
  readonly submitting = input(false);
  readonly formSubmit = output<RolePayload>();
  protected readonly form = this.fb.group({ name: ['', [Validators.required, Validators.maxLength(50)]] });
  constructor() { effect(() => { const role = this.initialValue(); if (role) this.form.patchValue({ name: role.name }); }); }
  protected submit(): void { if (this.form.invalid || this.submitting()) { this.form.markAllAsTouched(); return; } this.formSubmit.emit({ name: this.form.controls.name.value.trim() }); }
}
