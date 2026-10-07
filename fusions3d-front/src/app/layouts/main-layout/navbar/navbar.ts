import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavLink {
  label: string;
  path: string;
  exact: boolean;
}

/** Barra de navegación principal: logo, enlaces y menú responsive. */
@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
})
export class Navbar {
  protected readonly menuOpen = signal(false);

  protected readonly links: NavLink[] = [
    { label: 'Catálogo', path: '/impresiones', exact: true },
  ];
}
