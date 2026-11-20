import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../../../core/store/auth.store';
import { getControlErrorMessage } from '../../../../shared/utils/custom-validators';
import { getErrorMessage } from '../../../../shared/utils/error-message.util';

/** Formulario de inicio de sesión con email y contraseña. */
@Component({ selector: 'app-login', imports: [ReactiveFormsModule, RouterLink], templateUrl: './login.html' })
export class LoginPage {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  /** Ruta a la que volver tras iniciar sesión (query param `returnUrl`). */
  readonly returnUrl = input<string | undefined>(undefined);
  /** Motivo de llegada a la pantalla (query param `reason`, p. ej. `expired`). */
  readonly reason = input<string | undefined>(undefined);
  /** Indica que la cuenta se acaba de crear (query param `registered`). */
  readonly registered = input<string | undefined>(undefined);

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected get infoMessage(): string | null {
    if (this.reason() === 'expired') return 'Tu sesión ha expirado. Inicia sesión de nuevo.';
    if (this.registered() === '1') return 'Cuenta creada correctamente. Ya puedes iniciar sesión.';
    return null;
  }
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

  /** Solo acepta rutas internas para evitar redirecciones a otros dominios. Sin `returnUrl`, los admins van al panel. */
  private target(): string {
    const url = this.returnUrl();
    const isInternal = !!url && url.startsWith('/') && !url.startsWith('//') && !url.startsWith('/login');
    if (isInternal) return url;
    return this.auth.isAdmin() ? '/inicio' : '/';
  }
}
