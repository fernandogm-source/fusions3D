import { Component, DestroyRef, effect, inject, input, untracked } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PrintVariantsStore } from '../../../../core/store/print-variants.store';
import { VariantReference } from '../../../../core/models/print-variant.model';
import { ErrorState } from '../../../../shared/components/error-state/error-state';

@Component({ selector: 'app-print-variant-detail', imports: [RouterLink, CurrencyPipe, ErrorState], templateUrl: './print-variant-detail.html' })
export class PrintVariantDetailPage {
  readonly id = input.required<string>(); protected readonly store = inject(PrintVariantsStore); protected readonly variant = this.store.selected;
  constructor() {
    effect(() => { const id = this.id(); untracked(() => void this.store.loadById(id)); });
    inject(DestroyRef).onDestroy(() => this.store.clearSelected());
  }
  protected retry(): void { void this.store.loadById(this.id()); }
  protected label(value: string | VariantReference): string { return typeof value === 'string' ? value : value.name; }
}
