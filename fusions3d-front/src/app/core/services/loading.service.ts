import { computed, Injectable, signal } from '@angular/core';

/**
 * Indicador global de carga basado en Signals.
 * Lleva la cuenta de peticiones HTTP pendientes para
 * mostrar/ocultar el loader global.
 */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly pendingRequests = signal(0);

  /** true mientras haya al menos una petición HTTP en curso */
  readonly isLoading = computed(() => this.pendingRequests() > 0);

  show(): void {
    this.pendingRequests.update((n) => n + 1);
  }

  hide(): void {
    this.pendingRequests.update((n) => Math.max(0, n - 1));
  }
}
