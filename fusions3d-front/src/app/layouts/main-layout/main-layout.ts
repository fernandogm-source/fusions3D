import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Loader } from '../../shared/components/loader/loader';
import { Navbar } from './navbar/navbar';

/** Layout principal: navbar + contenido + footer + loader global. */
@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, Navbar, Loader],
  templateUrl: './main-layout.html',
})
export class MainLayout {
  protected readonly year = new Date().getFullYear();
}
