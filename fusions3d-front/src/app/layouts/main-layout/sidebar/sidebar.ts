import { Component, computed, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '../../../core/store/auth.store';

interface NavLink {
  label: string;
  path: string;
  icon: 'home' | 'catalog' | 'tag' | 'layers' | 'cube' | 'shield' | 'users' | 'user';
  adminOnly?: boolean;
}

interface NavSection {
  title: string;
  links: NavLink[];
}

/**
 * Barra lateral de navegación: fija en escritorio y en cajón deslizante en móvil.
 * Los usuarios sin rol ADMIN solo ven su perfil.
 */
@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
})
export class Sidebar {
  readonly open = input(false);
  readonly close = output();

  protected readonly auth = inject(AuthStore);

  protected readonly homePath = computed(() => (this.auth.isAdmin() ? '/inicio' : '/perfil'));

  private readonly sections: NavSection[] = [
    {
      title: 'General',
      links: [{ label: 'Inicio', path: '/inicio', icon: 'home', adminOnly: true }],
    },
    {
      title: 'Catálogo',
      links: [{ label: 'Impresiones', path: '/impresiones', icon: 'catalog', adminOnly: true }],
    },
    {
      title: 'Administración',
      links: [
        { label: 'Categorías', path: '/admin/categories', icon: 'tag', adminOnly: true },
        { label: 'Materiales', path: '/admin/materials', icon: 'layers', adminOnly: true },
        { label: 'Variantes', path: '/admin/print-variants', icon: 'cube', adminOnly: true },
        { label: 'Roles', path: '/admin/roles', icon: 'shield', adminOnly: true },
        { label: 'Usuarios', path: '/admin/users', icon: 'users', adminOnly: true },
      ],
    },
    {
      title: 'Cuenta',
      links: [{ label: 'Mi perfil', path: '/perfil', icon: 'user' }],
    },
  ];

  protected readonly visibleSections = computed(() =>
    this.sections
      .map((section) => ({
        ...section,
        links: section.links.filter((link) => !link.adminOnly || this.auth.isAdmin()),
      }))
      .filter((section) => section.links.length > 0),
  );
}
