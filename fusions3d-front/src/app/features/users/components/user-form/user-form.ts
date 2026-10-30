import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { User, UserPayload } from '../../../../core/models/user.model';
import { Role } from '../../../../core/models/role.model';
import { RolesService } from '../../../../core/services/roles.service';
import { showError } from '../../../../shared/utils/alert.util';
import { getControlErrorMessage } from '../../../../shared/utils/custom-validators';

const PASSWORD_MIN_LENGTH = 12;
const USERNAME_PATTERN = /^[a-zA-Z0-9._-]+$/;

@Component({ selector: 'app-user-form', imports: [ReactiveFormsModule, RouterLink], templateUrl: './user-form.html' })
export class UserForm {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly rolesService = inject(RolesService);
  readonly initialValue = input<User | null>(null);
  readonly submitLabel = input('Guardar usuario');
  readonly cancelUrl = input('/admin/users');
  readonly submitting = input(false);
  /** Impide cambiar el rol (por ejemplo, en la propia cuenta). */
  readonly lockRole = input(false);
  readonly formSubmit = output<UserPayload>();
  protected readonly roles = signal<Role[]>([]);
  protected readonly form = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30), Validators.pattern(USERNAME_PATTERN)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(PASSWORD_MIN_LENGTH)]],
    role: [''],
  });

  constructor() {
    void firstValueFrom(this.rolesService.getActive())
      .then((roles) => this.roles.set(roles))
      .catch(() => showError('No se pudieron cargar los roles.'));

    effect(() => {
      const user = this.initialValue();
      const passwordControl = this.form.controls.password;
      if (user) {
        passwordControl.removeValidators(Validators.required);
        passwordControl.updateValueAndValidity({ emitEvent: false });
        this.form.patchValue({ username: user.username, email: user.email, role: user.role });
      } else {
        passwordControl.addValidators(Validators.required);
        passwordControl.updateValueAndValidity({ emitEvent: false });
      }
    });

    effect(() => {
      const roleControl = this.form.controls.role;
      if (this.lockRole()) roleControl.disable({ emitEvent: false });
      else roleControl.enable({ emitEvent: false });
    });
  }

  protected fieldError(name: 'username' | 'email' | 'password', label: string): string | null {
    return getControlErrorMessage(this.form.controls[name], label);
  }

  protected submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const payload: UserPayload = {
      username: value.username.trim().toLowerCase(),
      email: value.email.trim().toLowerCase(),
    };
    if (value.password) payload.password = value.password;
    if (value.role) payload.role = value.role;
    this.formSubmit.emit(payload);
  }
}
