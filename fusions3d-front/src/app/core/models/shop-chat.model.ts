/** Mensaje del chat de la tienda. El historial se envía completo en cada petición. */
export interface ShopChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** Respuesta de Fusionito. */
export interface ShopChatReply {
  reply: string;
}
