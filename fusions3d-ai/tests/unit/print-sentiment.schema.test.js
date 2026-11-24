const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  printSentimentRequestSchema,
  printSentimentResponseSchema
} = require('../../src/schemas/print-sentiment.schema');

test('acepta una petición con nombre de impresión y comentarios válidos', () => {
  const result = printSentimentRequestSchema.safeParse({
    printName: '  Soporte para auriculares ',
    reviews: [{ rating: 5, comment: ' Muy bueno ' }]
  });

  assert.equal(result.success, true);
  assert.equal(result.data.printName, 'Soporte para auriculares');
  assert.equal(result.data.reviews[0].comment, 'Muy bueno');
});

test('rechaza una petición sin comentarios', () => {
  assert.equal(printSentimentRequestSchema.safeParse({ printName: 'Pieza', reviews: [] }).success, false);
});

test('rechaza valoraciones fuera del rango 1-5', () => {
  const reviews = [{ rating: 6, comment: 'Texto' }];
  assert.equal(printSentimentRequestSchema.safeParse({ printName: 'Pieza', reviews }).success, false);
});

test('valida la respuesta de la IA con porcentajes y resumen', () => {
  const valid = printSentimentResponseSchema.safeParse({ positive: 60, neutral: 30, negative: 10, summary: 'Resumen' });
  const missingSummary = printSentimentResponseSchema.safeParse({ positive: 60, neutral: 30, negative: 10 });

  assert.equal(valid.success, true);
  assert.equal(missingSummary.success, false);
});
