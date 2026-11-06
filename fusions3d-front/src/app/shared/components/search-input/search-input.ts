import { Component, DestroyRef, effect, inject, input, output, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

/** Buscador con debounce: emite `valueChange` cuando el usuario deja de escribir. */
@Component({
  selector: 'app-search-input',
  templateUrl: './search-input.html',
})
export class SearchInput {
  readonly value = input<string>('');
  readonly placeholder = input<string>('Buscar…');
  readonly debounceMs = input<number>(150);
  readonly valueChange = output<string>();

  protected readonly text = signal('');
  private lastEmitted = '';
  private readonly typed = new Subject<string>();

  constructor() {
    this.typed
      .pipe(
        debounceTime(this.debounceMs()),
        distinctUntilChanged(),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe((text) => {
        this.lastEmitted = text.trim();
        this.valueChange.emit(this.lastEmitted);
      });

    // Solo se sincroniza con cambios externos (p. ej. "limpiar filtros").
    // Los valores que el propio componente acaba de emitir se ignoran para no pisar lo que se esté escribiendo.
    effect(() => {
      const external = this.value();
      untracked(() => {
        if (external !== this.lastEmitted) {
          this.lastEmitted = external;
          this.text.set(external);
        }
      });
    });
  }

  protected onInput(text: string): void {
    this.text.set(text);
    this.typed.next(text);
  }

  protected clear(): void {
    this.text.set('');
    this.lastEmitted = '';
    this.valueChange.emit('');
  }
}
