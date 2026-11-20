import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { getControlErrorMessage } from '../../../../shared/utils/custom-validators';
import { getErrorMessage } from '../../../../shared/utils/error-message.util';

const passwordsMatch: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const password = group.get('password')?.value;
  const confirmation = group.get('confirmPassword')?.value;
  return password && confirmation && password !== confirmation ? { passwordMismatch: true } : null;
};

/** Formulario de registro de clientes. Tras crear la cuenta se redirige al login. */
@Component({ selector: 'app-register', imports: [ReactiveFormsModule, RouterLink], templateUrl: './register.html' })
export class RegisterPage {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly form = this.fb.group(
    {
      email: ['', [Validators.required, Validators.email]],
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30), Validators.pattern(/^[a-zA-Z0-9._-]+$/)]],
      password: ['', [Validators.required, Validators.minLength(12)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatch },
  );

  protected getError(controlName: 'email' | 'username' | 'password' | 'confirmPassword', label: string): string | null {
    const control = this.form.controls[controlName];
    if (controlName === 'confirmPassword' && this.form.hasError('passwordMismatch') && control.touched) {
      return 'Las contraseñas no coinciden.';
    }
    return getControlErrorMessage(control, label);
  }

  protected async submit(): Promise<void> {
    this.errorMessage.set(null);
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    try {
      const { email, username, password } = this.form.getRawValue();
      await firstValueFrom(this.authService.register({ email: email.trim(), username: username.trim(), password }));
      await this.router.navigate(['/login'], { queryParams: { registered: '1' } });
    } catch (error) {
      this.errorMessage.set(getErrorMessage(error));
    } finally {
      this.submitting.set(false);
    }
  }
}
