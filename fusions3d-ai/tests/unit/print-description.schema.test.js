const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  printDescriptionRequestSchema,
  printDescriptionResponseSchema
} = require('../../src/schemas/print-description.schema');

test('acepta una petición con nombre y categoría y aplica el idioma por defecto', () => {
  const result = printDescriptionRequestSchema.parse({
    name: '  Soporte para auriculares  ',
    category: 'Organización'
  });

  assert.equal(result.name, 'Soporte para auriculares');
  assert.equal(result.category, 'Organización');
  assert.equal(result.locale, 'es');
});

test('rechaza un nombre vacío', () => {
  assert.equal(printDescriptionRequestSchema.safeParse({ name: '   ', category: 'Hogar' }).success, false);
});

test('rechaza una petición sin categoría', () => {
  assert.equal(printDescriptionRequestSchema.safeParse({ name: 'Pieza' }).success, false);
  assert.equal(printDescriptionRequestSchema.safeParse({ name: 'Pieza', category: '   ' }).success, false);
});

test('no conserva campos que el servicio no debe recibir', () => {
  const result = printDescriptionRequestSchema.parse({
    name: 'Pieza',
    category: 'Hogar',
    material: 'PLA',
    dimensions: { width: 1, height: 1, depth: 1 }
  });

  assert.equal('material' in result, false);
  assert.equal('dimensions' in result, false);
});

test('rechaza un idioma distinto de castellano', () => {
  assert.equal(printDescriptionRequestSchema.safeParse({ name: 'Pieza', category: 'Hogar', locale: 'ca' }).success, false);
  assert.equal(printDescriptionRequestSchema.safeParse({ name: 'Pieza', category: 'Hogar', locale: 'en' }).success, false);
});

test('valida la respuesta de la IA', () => {
  const valid = printDescriptionResponseSchema.safeParse({
    description: 'Texto de prueba',
    shortDescription: 'Resumen'
  });
  const missingShort = printDescriptionResponseSchema.safeParse({
    description: 'Texto de prueba'
  });

  assert.equal(valid.success, true);
  assert.equal(missingShort.success, false);
});
