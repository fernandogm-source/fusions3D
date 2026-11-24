const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  printReviewSummaryRequestSchema,
  printReviewSummaryResponseSchema
} = require('../../src/schemas/print-review-summary.schema');

test('acepta una petición con nombre de impresión y comentarios válidos', () => {
  const result = printReviewSummaryRequestSchema.safeParse({
    printName: '  Soporte para auriculares ',
    reviews: [{ rating: 4, comment: ' Muy bueno ' }]
  });

  assert.equal(result.success, true);
  assert.equal(result.data.printName, 'Soporte para auriculares');
  assert.equal(result.data.reviews[0].comment, 'Muy bueno');
});

test('rechaza una petición sin comentarios', () => {
  assert.equal(printReviewSummaryRequestSchema.safeParse({ printName: 'Pieza', reviews: [] }).success, false);
});

test('valida la respuesta de la IA con un resumen', () => {
  const valid = printReviewSummaryResponseSchema.safeParse({ summary: 'Los clientes destacan el acabado.' });
  const missingSummary = printReviewSummaryResponseSchema.safeParse({});

  assert.equal(valid.success, true);
  assert.equal(missingSummary.success, false);
});
