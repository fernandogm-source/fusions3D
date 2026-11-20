const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chatRequestSchema, chatResponseSchema } = require('../../src/schemas/chat.schema');

test('acepta una conversación que termina en mensaje del usuario y aplica productos vacíos por defecto', () => {
  const result = chatRequestSchema.parse({
    messages: [{ role: 'user', content: '  Hola  ' }]
  });

  assert.equal(result.messages[0].content, 'Hola');
  assert.deepEqual(result.products, []);
});

test('rechaza una conversación vacía o que termina en mensaje del asistente', () => {
  assert.equal(chatRequestSchema.safeParse({ messages: [] }).success, false);
  assert.equal(chatRequestSchema.safeParse({
    messages: [{ role: 'user', content: 'Hola' }, { role: 'assistant', content: '¡Hola!' }]
  }).success, false);
});

test('rechaza más de 5 productos de contexto', () => {
  const product = { name: 'Pieza', category: 'Hogar', slug: 'pieza', minPrice: 1, maxPrice: 2 };
  const result = chatRequestSchema.safeParse({
    messages: [{ role: 'user', content: 'Qué tenéis' }],
    products: Array(6).fill(product)
  });

  assert.equal(result.success, false);
});

test('valida la respuesta de la IA', () => {
  assert.equal(chatResponseSchema.safeParse({ reply: '¡Hola! Soy Fusionito.' }).success, true);
  assert.equal(chatResponseSchema.safeParse({}).success, false);
});
