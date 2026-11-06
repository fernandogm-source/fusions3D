import { Component, DestroyRef, effect, inject, input, output, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, Subject } from 'rxjs';
import { ShopPriceRange } from '../../../core/models/shop.model';
import { clampPriceRange, PriceRange } from '../../utils/price-range.util';
import { formatPrecio } from '../../utils/format.util';

/**
 * Slider de rango de precio con dos controles. Emite `rangeChange` con debounce
 * mientras el usuario arrastra, y se resincroniza solo con cambios externos.
 */
@Component({
  selector: 'app-price-range-slider',
  templateUrl: './price-range-slider.html',
})
export class PriceRangeSlider {
  readonly bounds = input.required<ShopPriceRange>();
  readonly min = input<number | null>(null);
  readonly max = input<number | null>(null);
  readonly rangeChange = output<PriceRange>();

  protected readonly low = signal(0);
  protected readonly high = signal(0);
  protected readonly format = formatPrecio;
  private lastEmitted: PriceRange | null = null;
  private readonly changes = new Subject<PriceRange>();

  constructor() {
    this.changes
      .pipe(debounceTime(300), takeUntilDestroyed(inject(DestroyRef)))
      .subscribe((range) => this.rangeChange.emit(range));

    effect(() => {
      const bounds = this.bounds();
      const min = this.min() ?? bounds.min;
      const max = this.max() ?? bounds.max;

      untracked(() => {
        const external = clampPriceRange(min, max, bounds);
        const same = this.lastEmitted !== null
          && this.lastEmitted.min === external.min
          && this.lastEmitted.max === external.max;

        if (!same) {
          this.low.set(external.min);
          this.high.set(external.max);
          this.lastEmitted = null;
        }
      });
    });
  }

  protected onLow(value: string): void {
    const next = Math.min(Number(value), this.high());
    this.low.set(next);
    this.emit();
  }

  protected onHigh(value: string): void {
    const next = Math.max(Number(value), this.low());
    this.high.set(next);
    this.emit();
  }

  private emit(): void {
    this.lastEmitted = { min: this.low(), max: this.high() };
    this.changes.next(this.lastEmitted);
  }
}
