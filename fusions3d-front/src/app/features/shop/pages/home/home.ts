import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { Carousel } from '../../../../shared/components/carousel/carousel';
import { CategoryCard } from '../../components/category-card/category-card';
import { ColorCard } from '../../components/color-card/color-card';
import { MaterialCard } from '../../components/material-card/material-card';
import { PrintCard } from '../../components/print-card/print-card';
import { ShopHomeStore } from '../../store/shop-home.store';

/** Portada pública: carruseles de categorías, materiales, colores y últimas impresiones. */
@Component({
  selector: 'app-shop-home',
  imports: [RouterLink, Carousel, CategoryCard, MaterialCard, ColorCard, PrintCard, ErrorState],
  providers: [ShopHomeStore],
  templateUrl: './home.html',
})
export class ShopHomePage {
  protected readonly store = inject(ShopHomeStore);

  constructor() {
    void this.store.load();
  }

  protected retry(): void {
    void this.store.load();
  }
}
