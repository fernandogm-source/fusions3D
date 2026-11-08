import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { StoreHeader } from '../../shared/components/store-header/store-header';
import { Loader } from '../../shared/components/loader/loader';
import { Sidebar } from './sidebar/sidebar';

/** Layout principal: sidebar + cabecera compartida + contenido + footer + loader global. */
@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, Sidebar, StoreHeader, Loader],
  templateUrl: './main-layout.html',
})
export class MainLayout {
  protected readonly year = new Date().getFullYear();
  protected readonly sidebarOpen = signal(false);
}
