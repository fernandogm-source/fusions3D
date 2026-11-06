import { Component, computed, input, signal } from '@angular/core';

/**
 * Avatar del usuario: muestra la imagen de `url` y, si no hay URL o la imagen
 * no carga, la inicial. Las clases de tamaño y estilo se pasan desde fuera.
 */
@Component({
  selector: 'app-user-avatar',
  templateUrl: './user-avatar.html',
  host: {
    class: 'grid place-items-center overflow-hidden rounded-full bg-gradient-to-br from-brand to-brand-dark font-bold text-white',
    'aria-hidden': 'true',
  },
})
export class UserAvatar {
  readonly url = input<string | null | undefined>(null);
  readonly initial = input('');

  private readonly failedUrl = signal<string | null>(null);
  protected readonly src = computed(() => {
    const url = this.url();
    return url && url !== this.failedUrl() ? url : null;
  });

  protected onError(url: string): void {
    this.failedUrl.set(url);
  }
}
