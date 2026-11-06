const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  tokenize,
  escapeRegex,
  accentInsensitive,
  buildSearchMatch,
  buildRelevanceExpression
} = require('../../src/utils/search.util');

test('tokenize normaliza espacios y mayúsculas', () => {
  assert.deepEqual(tokenize('  Soporte   PARA móvil '), ['soporte', 'para', 'móvil']);
  assert.deepEqual(tokenize(''), []);
  assert.deepEqual(tokenize(null), []);
});

test('tokenize limita el número de palabras y su longitud', () => {
  assert.equal(tokenize('uno dos tres cuatro cinco seis siete').length, 5);
  assert.equal(tokenize('a'.repeat(120))[0].length, 50);
});

test('escapeRegex neutraliza los caracteres especiales', () => {
  assert.equal(escapeRegex('a.b*c'), 'a\\.b\\*c');
  assert.equal(escapeRegex('(precio) [x]'), '\\(precio\\) \\[x\\]');
  assert.equal(new RegExp(escapeRegex('.*')).test('cualquier texto'), false);
});

test('accentInsensitive acepta la letra con y sin tilde', () => {
  assert.equal(accentInsensitive('dragon'), 'dr[aáàâä]g[oóòôö][nñ]');
  assert.equal(new RegExp(accentInsensitive('dragon'), 'i').test('Dragón'), true);
});

test('buildSearchMatch exige el inicio de una palabra en nombre o descripción', () => {
  const match = buildSearchMatch(tokenize('sopor'));
  const pattern = match.$and[0].$or[0].name;

  assert.equal(pattern.test('Soporte para móvil'), true);
  assert.equal(pattern.test('El soporte'), true);
  assert.equal(pattern.test('oporte'), false);
});

test('buildSearchMatch combina todas las palabras con AND', () => {
  const match = buildSearchMatch(tokenize('soporte móvil'));

  assert.equal(match.$and.length, 2);
  assert.equal(match.$and[1].$or[0].name.test('Soporte para móvil'), true);
  assert.equal(match.$and[1].$or[0].name.test('Soporte para tablet'), false);
});

test('buildSearchMatch no interpreta el texto como expresión regular', () => {
  const match = buildSearchMatch(tokenize('.*'));
  const pattern = match.$and[0].$or[0].name;

  assert.equal(pattern.test('Soporte'), false);
  assert.equal(pattern.test('.*'), true);
});

test('buildRelevanceExpression puntúa mejor el nombre que empieza por el texto', () => {
  const relevance = buildRelevanceExpression('dragon');
  const startsName = relevance.$cond[0].$regexMatch.regex;

  assert.equal(relevance.$cond[1], 2);
  assert.equal(relevance.$cond[2].$cond[1], 1);
  assert.equal(new RegExp(startsName, 'i').test('Dragón articulado'), true);
  assert.equal(new RegExp(startsName, 'i').test('Figura dragón'), false);
});
