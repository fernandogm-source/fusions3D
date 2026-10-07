import { Component, input } from '@angular/core';
import { Impresion } from '../../../../core/models/impresion.model';
import { ImpresionCard } from '../impresion-card/impresion-card';

/** Grid responsive con el listado de cards de impresiones. */
@Component({
  selector: 'app-impresion-grid',
  imports: [ImpresionCard],
  templateUrl: './impresion-grid.html',
})
export class ImpresionGrid {
  readonly impresions = input.required<Impresion[]>();
}
