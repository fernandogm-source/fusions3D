import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ADMIN_ROLE, AuthUser, LoginPayload } from '../models/auth.model';
import { AuthService } from '../services/auth.service';

/**
 * Estado global de autenticación. Guarda el usuario de la sesión actual;
 * el token vive en una cookie HttpOnly gestionada por el backend.
 */
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly service = inject(AuthService);
  private readonly router = inject(Router);
  private readonly _user = signal<AuthUser | null>(null);
  private sessionCheck: Promise<void> | null = null;

  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly isAdmin = computed(() => this._user()?.role === ADMIN_ROLE);

  /** Consulta la sesión una sola vez por carga de la aplicación. */
  restoreSession(): Promise<void> {
    this.sessionCheck ??= firstValueFrom(this.service.me())
      .then((user) => this._user.set(user))
      .catch(() => this._user.set(null));
    return this.sessionCheck;
  }

  /** Vuelve a leer la identidad de la sesión (p. ej. tras cambiar el username). */
  async refreshSession(): Promise<void> {
    this._user.set(await firstValueFrom(this.service.me()));
  }

  async login(payload: LoginPayload): Promise<void> {
    const { user } = await firstValueFrom(this.service.login(payload));
    this._user.set(user);
    this.sessionCheck = Promise.resolve();
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.service.logout());
    } catch {
      // Aunque falle la petición, la sesión local se cierra igualmente.
    }
    this.clearSession();
    await this.router.navigateByUrl('/login');
  }

  clearSession(): void {
    this._user.set(null);
    this.sessionCheck = Promise.resolve();
  }
}
