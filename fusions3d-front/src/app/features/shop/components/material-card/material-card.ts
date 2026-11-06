import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ShopMaterial } from '../../../../core/models/shop.model';

/** Card de material para el home. Enlaza al catálogo filtrado por ese material. */
@Component({
  selector: 'app-material-card',
  imports: [RouterLink],
  templateUrl: './material-card.html',
})
export class MaterialCard {
  readonly material = input.required<ShopMaterial>();
}
