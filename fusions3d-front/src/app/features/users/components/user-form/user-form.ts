import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { User, UserPayload } from '../../../../core/models/user.model';
import { Role } from '../../../../core/models/role.model';
import { RolesService } from '../../../../core/services/roles.service';
import { showError } from '../../../../shared/utils/alert.util';

@Component({ selector: 'app-user-form', imports: [ReactiveFormsModule, RouterLink], templateUrl: './user-form.html' })
export class UserForm {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly rolesService = inject(RolesService);
  readonly initialValue = input<User | null>(null);
  readonly submitLabel = input('Guardar usuario');
  readonly cancelUrl = input('/admin/users');
  readonly submitting = input(false);
  readonly formSubmit = output<UserPayload>();
  protected readonly roles = signal<Role[]>([]);
  protected readonly formError = signal<string | null>(null);
  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    phone: [''],
    roles: this.fb.control<string[]>([]),
    street: [''], city: [''], state: [''], postalCode: [''], country: [''],
    isDefault: [false],
  });

  constructor() {
    void firstValueFrom(this.rolesService.getActive()).then((roles) => this.roles.set(roles))
      .catch(() => showError('No se pudieron cargar los roles.'));
    effect(() => {
      const user = this.initialValue();
      const passwordControl = this.form.controls.password;
      if (user) {
        passwordControl.removeValidators(Validators.required);
        passwordControl.updateValueAndValidity({ emitEvent: false });
        const address = user.addresses?.[0];
        this.form.patchValue({
          name: user.name, email: user.email, phone: user.phone ?? '',
          roles: user.roles.map((role) => typeof role === 'string' ? role : role._id),
          street: address?.street ?? '', city: address?.city ?? '', state: address?.state ?? '',
          postalCode: address?.postalCode ?? '', country: address?.country ?? '', isDefault: address?.isDefault ?? false,
        });
      } else {
        passwordControl.addValidators(Validators.required);
        passwordControl.updateValueAndValidity({ emitEvent: false });
      }
    });
  }

  protected submit(): void {
    this.formError.set(null);
    if (this.form.invalid || this.submitting()) { this.form.markAllAsTouched(); return; }
    const value = this.form.getRawValue();
    const hasAddress = [value.street, value.city, value.state, value.postalCode, value.country].some((part) => part.trim());
    const addressRequired = [value.street, value.city, value.postalCode, value.country].every((part) => part.trim());
    if (hasAddress && !addressRequired) {
      this.formError.set('Completa calle, ciudad, código postal y país, o deja la dirección vacía.');
      return;
    }
    const payload: UserPayload = {
      name: value.name.trim(), email: value.email.trim(), roles: value.roles,
      phone: value.phone.trim() || null,
    };
    if (value.password) payload.password = value.password;
    if (hasAddress) {
      const previous = this.initialValue()?.addresses ?? [];
      payload.addresses = [{
        street: value.street.trim(), city: value.city.trim(), state: value.state.trim(),
        postalCode: value.postalCode.trim(), country: value.country.trim(), isDefault: value.isDefault,
      }, ...previous.slice(1)];
    }
    this.formSubmit.emit(payload);
  }
}
