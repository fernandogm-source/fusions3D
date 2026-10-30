import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthStore } from '../../../../core/store/auth.store';
import { getControlErrorMessage } from '../../../../shared/utils/custom-validators';
import { getErrorMessage } from '../../../../shared/utils/error-message.util';

const DEFAULT_TARGET = '/inicio';

/** Formulario de inicio de sesión con email y contraseña. */
@Component({ selector: 'app-login', imports: [ReactiveFormsModule], templateUrl: './login.html' })
export class LoginPage {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  /** Ruta a la que volver tras iniciar sesión (query param `returnUrl`). */
  readonly returnUrl = input<string | undefined>(undefined);

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  constructor() {
    void this.auth.restoreSession().then(() => {
      if (this.auth.isAuthenticated()) void this.router.navigateByUrl(this.target());
    });
  }

  protected getError(controlName: 'email' | 'password', label: string): string | null {
    return getControlErrorMessage(this.form.controls[controlName], label);
  }

  protected async submit(): Promise<void> {
    this.errorMessage.set(null);
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    try {
      const { email, password } = this.form.getRawValue();
      await this.auth.login({ email: email.trim(), password });
      await this.router.navigateByUrl(this.target());
    } catch (error) {
      this.errorMessage.set(getErrorMessage(error));
    } finally {
      this.submitting.set(false);
    }
  }

  /** Solo acepta rutas internas para evitar redirecciones a otros dominios. */
  private target(): string {
    const url = this.returnUrl();
    const isInternal = !!url && url.startsWith('/') && !url.startsWith('//') && !url.startsWith('/login');
    return isInternal ? url : DEFAULT_TARGET;
  }
}
