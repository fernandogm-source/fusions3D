import { Component, input } from '@angular/core';
import { ShopPrintCard } from '../../../../core/models/shop.model';
import { PrintCard } from '../print-card/print-card';

/** Listado en cuadrícula de impresiones. Compone `app-print-card` y muestra un esqueleto mientras carga. */
@Component({
  selector: 'app-print-list',
  imports: [PrintCard],
  templateUrl: './print-list.html',
})
export class PrintList {
  readonly prints = input.required<ShopPrintCard[]>();
  readonly loading = input<boolean>(false);

  protected readonly skeletonItems = Array.from({ length: 8 }, (_, index) => index);
}
