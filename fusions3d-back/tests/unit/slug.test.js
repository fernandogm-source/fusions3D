const { test } = require('node:test');
const assert = require('node:assert/strict');
const { toSlug } = require('../../src/utils/slug.util');

test('toSlug genera slugs en minúsculas sin acentos ni símbolos', () => {
  assert.equal(toSlug('Figuras y Coleccionables'), 'figuras-y-coleccionables');
  assert.equal(toSlug('Hogar y Decoración'), 'hogar-y-decoracion');
  assert.equal(toSlug('PLA'), 'pla');
  assert.equal(toSlug('Resin (Gris)'), 'resin-gris');
});

test('toSlug da el mismo slug para colores con distinta capitalización', () => {
  assert.equal(toSlug('Negro'), toSlug('negro'));
  assert.equal(toSlug(' Azul  claro '), 'azul-claro');
});
