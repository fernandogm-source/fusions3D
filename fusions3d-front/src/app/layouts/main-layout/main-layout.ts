import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ProfileStore } from '../../core/store/profile.store';
import { Loader } from '../../shared/components/loader/loader';
import { Sidebar } from './sidebar/sidebar';
import { Topbar } from './topbar/topbar';

/** Layout principal: sidebar + barra superior + contenido + footer + loader global. */
@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, Sidebar, Topbar, Loader],
  templateUrl: './main-layout.html',
})
export class MainLayout {
  private readonly profile = inject(ProfileStore);
  protected readonly year = new Date().getFullYear();
  protected readonly sidebarOpen = signal(false);

  constructor() {
    void this.profile.load();
  }
}
