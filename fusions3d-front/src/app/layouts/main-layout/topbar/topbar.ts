import { Component, DestroyRef, inject, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

const TITLES: [RegExp, string][] = [
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
  protected readonly title = signal('Fusions3D');

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
