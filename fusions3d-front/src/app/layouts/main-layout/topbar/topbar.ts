import { Component, computed, DestroyRef, inject, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { AuthStore } from '../../../core/store/auth.store';

const TITLES: [RegExp, string][] = [
  [/^\/inicio/, 'Inicio'],
  [/^\/perfil/, 'Mi perfil'],
  [/^\/impresiones\/nueva/, 'Nueva impresión'],
  [/^\/impresiones\/[^/]+\/editar/, 'Editar impresión'],
  [/^\/impresiones\/[^/]+/, 'Detalle de impresión'],
  [/^\/impresiones/, 'Catálogo de impresiones'],
  [/^\/admin\/categories/, 'Categorías'],
  [/^\/admin\/materials/, 'Materiales'],
  [/^\/admin\/print-variants/, 'Variantes'],
  [/^\/admin\/roles/, 'Roles'],
  [/^\/admin\/users/, 'Usuarios'],
];

/** Barra superior: botón de menú en móvil y título de la sección actual. */
@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.html',
})
export class Topbar {
  readonly menuToggle = output();

  private readonly router = inject(Router);
  protected readonly auth = inject(AuthStore);
  protected readonly title = signal('Fusions3D');
  protected readonly initial = computed(() => this.auth.user()?.username.charAt(0).toUpperCase() ?? '');

  protected logout(): void {
    void this.auth.logout();
  }

  constructor() {
    this.updateTitle(this.router.url);
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe((event) => this.updateTitle(event.urlAfterRedirects));
  }

  private updateTitle(url: string): void {
    const path = url.split(/[?#]/)[0];
    const match = TITLES.find(([pattern]) => pattern.test(path));
    this.title.set(match ? match[1] : 'Fusions3D');
  }
}
