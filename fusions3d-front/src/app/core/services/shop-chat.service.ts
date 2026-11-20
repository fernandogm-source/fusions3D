import { inject, Injectable } from '@angular/core';
import { ShopChatMessage, ShopChatReply } from '../models/shop-chat.model';
import { ShopApiClient } from './shop-api.client';

interface ShopChatEnvelope {
  success: true;
  data: ShopChatReply;
}

/** La respuesta de la IA puede tardar más que el timeout general de la tienda. */
const CHAT_TIMEOUT_MS = 60000;

/** Chat público de la tienda (`/api/shop/chat`). */
@Injectable({ providedIn: 'root' })
export class ShopChatService {
  private readonly client = inject(ShopApiClient);

  async sendMessage(messages: ShopChatMessage[], signal?: AbortSignal): Promise<string> {
    const body = await this.client.post<ShopChatEnvelope>('/chat', { messages }, signal, CHAT_TIMEOUT_MS);
    return body.data.reply;
  }
}
