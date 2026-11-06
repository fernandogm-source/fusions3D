const { test } = require('node:test');
const assert = require('node:assert/strict');
const { printsQuerySchema } = require('../../src/schemas/shop.schema');

test('valores por defecto de paginación', () => {
  const query = printsQuerySchema.parse({});

  assert.equal(query.page, 1);
  assert.equal(query.limit, 12);
});

test('acepta slugs separados por coma o repetidos y elimina duplicados', () => {
  const query = printsQuerySchema.parse({
    category: ['figuras-y-coleccionables,hogar-y-decoracion', 'figuras-y-coleccionables']
  });

  assert.deepEqual(query.category, ['figuras-y-coleccionables', 'hogar-y-decoracion']);
});

test('normaliza mayúsculas y espacios en los slugs', () => {
  const query = printsQuerySchema.parse({ material: ' PLA ' });

  assert.deepEqual(query.material, ['pla']);
});

test('rechaza slugs con caracteres no permitidos', () => {
  assert.throws(() => printsQuerySchema.parse({ color: 'negro; DROP' }));
  assert.throws(() => printsQuerySchema.parse({ category: '../admin' }));
});

test('convierte precios de texto a número y rechaza valores negativos', () => {
  const query = printsQuerySchema.parse({ minPrice: '5', maxPrice: '20.5' });

  assert.equal(query.minPrice, 5);
  assert.equal(query.maxPrice, 20.5);
  assert.throws(() => printsQuerySchema.parse({ minPrice: '-1' }));
});

test('rechaza minPrice mayor que maxPrice', () => {
  assert.throws(() => printsQuerySchema.parse({ minPrice: '30', maxPrice: '5' }));
});

test('limita el tamaño de página y el número de filtros', () => {
  assert.throws(() => printsQuerySchema.parse({ limit: '100' }));
  assert.throws(() => printsQuerySchema.parse({ page: '0' }));

  const tooMany = Array.from({ length: 21 }, (_, index) => `slug-${index}`).join(',');
  assert.throws(() => printsQuerySchema.parse({ color: tooMany }));
});

test('ignora parámetros desconocidos', () => {
  const query = printsQuerySchema.parse({ categoryId: '507f1f77bcf86cd799439011', foo: 'bar' });

  assert.equal(query.foo, undefined);
  assert.equal(query.categoryId, undefined);
});
