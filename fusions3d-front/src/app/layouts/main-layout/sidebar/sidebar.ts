import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavLink {
  label: string;
  path: string;
  icon: 'catalog' | 'tag' | 'layers' | 'cube' | 'shield' | 'users';
}

interface NavSection {
  title: string;
  links: NavLink[];
}

/** Barra lateral de navegación: fija en escritorio y en cajón deslizante en móvil. */
@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
})
export class Sidebar {
  readonly open = input(false);
  readonly close = output();

  protected readonly sections: NavSection[] = [
    {
      title: 'Catálogo',
      links: [{ label: 'Impresiones', path: '/impresiones', icon: 'catalog' }],
    },
    {
      title: 'Administración',
      links: [
        { label: 'Categorías', path: '/admin/categories', icon: 'tag' },
        { label: 'Materiales', path: '/admin/materials', icon: 'layers' },
        { label: 'Variantes', path: '/admin/print-variants', icon: 'cube' },
        { label: 'Roles', path: '/admin/roles', icon: 'shield' },
        { label: 'Usuarios', path: '/admin/users', icon: 'users' },
      ],
    },
  ];
}
