const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chatSchema } = require('../../src/schemas/shop.schema');

test('acepta una conversación que termina en mensaje del usuario', () => {
  const result = chatSchema.safeParse({
    messages: [
      { role: 'user', content: 'Hola' },
      { role: 'assistant', content: '¡Hola! Soy Fusionito.' },
      { role: 'user', content: '  Tenéis llaveros?  ' }
    ]
  });

  assert.equal(result.success, true);
  assert.equal(result.data.messages[2].content, 'Tenéis llaveros?');
});

test('rechaza conversaciones vacías o que terminan en el asistente', () => {
  assert.equal(chatSchema.safeParse({ messages: [] }).success, false);
  assert.equal(chatSchema.safeParse({
    messages: [{ role: 'user', content: 'Hola' }, { role: 'assistant', content: 'Hola' }]
  }).success, false);
});

test('rechaza más de 20 mensajes y mensajes vacíos', () => {
  const tooMany = Array.from({ length: 21 }, (_, index) => ({
    role: index % 2 === 0 ? 'user' : 'assistant',
    content: 'Hola'
  }));

  assert.equal(chatSchema.safeParse({ messages: tooMany }).success, false);
  assert.equal(chatSchema.safeParse({ messages: [{ role: 'user', content: '   ' }] }).success, false);
});
