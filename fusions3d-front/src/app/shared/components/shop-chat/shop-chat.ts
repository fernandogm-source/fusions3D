import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShopChatMessage } from '../../../core/models/shop-chat.model';
import { ShopChatService } from '../../../core/services/shop-chat.service';
import { getShopErrorMessage, isAbortError } from '../../../core/services/shop-api.client';

const GREETING: ShopChatMessage = {
  role: 'assistant',
  content: '¡Hola! Soy Fusionito 🤖. Pregúntame por nuestras impresiones o por cómo funciona la tienda.',
};

/** Máximo de mensajes de historial que se envían al backend (el mismo límite que valida la API). */
const MAX_HISTORY = 20;

/** Widget flotante del chat Fusionito. Solo se incluye en el layout público de la tienda. */
@Component({
  selector: 'app-shop-chat',
  imports: [FormsModule],
  templateUrl: './shop-chat.html',
})
export class ShopChat {
  private readonly chatService = inject(ShopChatService);
  private readonly destroyRef = inject(DestroyRef);
  private controller: AbortController | null = null;

  protected readonly open = signal(false);
  protected readonly messages = signal<ShopChatMessage[]>([GREETING]);
  protected readonly draft = signal('');
  protected readonly sending = signal(false);
  protected readonly error = signal<string | null>(null);

  constructor() {
    this.destroyRef.onDestroy(() => this.controller?.abort());
  }

  protected toggle(): void {
    this.open.update((value) => !value);
  }

  protected send(): void {
    const content = this.draft().trim();
    if (!content || this.sending()) return;

    const history = [...this.messages(), { role: 'user' as const, content }];

    this.messages.set(history);
    this.draft.set('');
    this.error.set(null);
    this.sending.set(true);

    this.controller = new AbortController();

    this.chatService
      .sendMessage(history.slice(-MAX_HISTORY), this.controller.signal)
      .then((reply) => this.messages.update((list) => [...list, { role: 'assistant', content: reply }]))
      .catch((error: unknown) => {
        if (isAbortError(error)) return;
        this.error.set(getShopErrorMessage(error));
        this.messages.update((list) => list.slice(0, -1));
        this.draft.set(content);
      })
      .finally(() => this.sending.set(false));
  }
}
