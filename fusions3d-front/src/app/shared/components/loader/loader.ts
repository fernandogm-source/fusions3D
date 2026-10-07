import { Component, inject } from '@angular/core';
import { LoadingService } from '../../../core/services/loading.service';

/**
 * Indicador global de carga. Se muestra automáticamente mientras
 * haya peticiones HTTP pendientes (ver `loadingInterceptor`).
 */
@Component({
  selector: 'app-loader',
  templateUrl: './loader.html',
})
export class Loader {
  protected readonly loadingService = inject(LoadingService);
}
