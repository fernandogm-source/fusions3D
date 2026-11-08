import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { StoreHeader } from '../../shared/components/store-header/store-header';

/** Layout público de la tienda: cabecera compartida, contenido y pie. No requiere sesión. */
@Component({
  selector: 'app-shop-layout',
  imports: [RouterOutlet, StoreHeader],
  templateUrl: './shop-layout.html',
})
export class ShopLayout {
  protected readonly year = new Date().getFullYear();
}
