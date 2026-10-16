import { Component, input, output } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PrintVariant, VariantReference } from '../../../../core/models/print-variant.model';

@Component({ selector: 'app-print-variant-table', imports: [RouterLink, CurrencyPipe], templateUrl: './print-variant-table.html' })
export class PrintVariantTable {
  readonly variants = input.required<PrintVariant[]>(); readonly trashView = input(false);
  readonly toggleActive = output<PrintVariant>(); readonly remove = output<PrintVariant>(); readonly restore = output<PrintVariant>();
  protected label(value: string | VariantReference): string { return typeof value === 'string' ? value : value.name; }
}
