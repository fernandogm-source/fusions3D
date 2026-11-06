import {
  afterNextRender,
  Component,
  ElementRef,
  HostListener,
  input,
  signal,
  viewChild,
} from '@angular/core';

/**
 * Carrusel horizontal con scroll-snap. Los elementos proyectados deben llevar `snap-start`
 * y un ancho fijo (`w-64 shrink-0`, por ejemplo).
 */
@Component({
  selector: 'app-carousel',
  templateUrl: './carousel.html',
})
export class Carousel {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');

  private readonly track = viewChild.required<ElementRef<HTMLElement>>('track');
  protected readonly canScrollPrev = signal(false);
  protected readonly canScrollNext = signal(false);

  constructor() {
    afterNextRender(() => this.updateState());
  }

  @HostListener('window:resize')
  protected onResize(): void {
    this.updateState();
  }

  protected scroll(direction: 1 | -1): void {
    const element = this.track().nativeElement;
    element.scrollBy({ left: direction * element.clientWidth * 0.8, behavior: 'smooth' });
  }

  protected updateState(): void {
    const element = this.track().nativeElement;
    this.canScrollPrev.set(element.scrollLeft > 4);
    this.canScrollNext.set(element.scrollLeft + element.clientWidth < element.scrollWidth - 4);
  }
}
