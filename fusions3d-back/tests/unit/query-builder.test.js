const { test } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { buildMatch, buildSort } = require('../../src/utils/query-builder.util');

const ID_A = '507f1f77bcf86cd799439011';
const ID_B = '507f1f77bcf86cd799439012';

test('buildMatch convierte categorías a ObjectId y las agrupa en $in', () => {
  const match = buildMatch('print', { category: [ID_A, ID_B] });

  assert.ok(match.categoryId.$in.every((id) => id instanceof mongoose.Types.ObjectId));
  assert.deepEqual(match.categoryId.$in.map(String), [ID_A, ID_B]);
});

test('buildMatch solo incluye filtros del destino pedido', () => {
  const params = { category: [ID_A], material: [ID_B], color: ['negro'] };

  assert.deepEqual(Object.keys(buildMatch('print', params)), ['categoryId']);
  assert.deepEqual(Object.keys(buildMatch('variant', params)).sort(), ['colorSlug', 'materialId']);
});

test('el color filtra por colorSlug sin convertir a ObjectId', () => {
  const match = buildMatch('variant', { color: ['negro', 'azul'] });

  assert.deepEqual(match, { colorSlug: { $in: ['negro', 'azul'] } });
});

test('el rango de precio usa $gte y $lte solo con los límites enviados', () => {
  assert.deepEqual(buildMatch('variant', { minPrice: 5 }), { salePrice: { $gte: 5 } });
  assert.deepEqual(buildMatch('variant', { minPrice: 5, maxPrice: 20 }), {
    salePrice: { $gte: 5, $lte: 20 }
  });
  assert.deepEqual(buildMatch('variant', {}), {});
});

test('buildSort devuelve el orden pedido y desempata por _id', () => {
  assert.deepEqual(buildSort('price_asc', false), { minPrice: 1, _id: 1 });
  assert.deepEqual(buildSort('price_desc', false), { minPrice: -1, _id: -1 });
});

test('buildSort usa newest por defecto y relevance solo con búsqueda', () => {
  assert.deepEqual(buildSort(undefined, false), { createdAt: -1, _id: -1 });
  assert.deepEqual(buildSort(undefined, true), { score: -1, _id: 1 });
  assert.deepEqual(buildSort('relevance', false), { createdAt: -1, _id: -1 });
});

test('buildSort ignora valores de orden desconocidos', () => {
  assert.deepEqual(buildSort('inventado', false), { createdAt: -1, _id: -1 });
});
