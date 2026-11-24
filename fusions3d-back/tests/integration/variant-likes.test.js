const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.JWT_SECRET ??= 'test-access-secret-with-at-least-32-bytes!!';
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret-with-at-least-32-bytes!';

const app = require('../../src/app');
const { signAccessToken } = require('../../src/utils/jwt.util');
const Category = require('../../src/models/category.model');
const Material = require('../../src/models/material.model');
const Print = require('../../src/models/print.model');
const PrintVariant = require('../../src/models/printVariant.model');
const Role = require('../../src/models/role.model');
const User = require('../../src/models/user.model');
const VariantLike = require('../../src/models/variant-like.model');

let mongod;
let server;
let baseUrl;
let token;
let otherToken;
let variantA;
let variantB;
let hiddenVariant;

async function seed() {
  const categoria = await Category.create({ name: 'Hogar', slug: 'hogar', status: 'published', isActive: true });
  const material = await Material.create({ name: 'PLA', slug: 'pla', isActive: true });

  const soporte = await Print.create({
    name: 'Soporte', slug: 'soporte', description: 'Soporte', categoryId: categoria._id,
    status: 'published', isActive: true
  });
  const borrador = await Print.create({
    name: 'Borrador', slug: 'borrador', description: 'Borrador', categoryId: categoria._id,
    status: 'draft', isActive: true
  });

  [variantA, variantB] = await PrintVariant.create([
    { printId: soporte._id, materialId: material._id, sku: 'SOP-A', slug: 'soporte-pla-negro', color: 'Negro', colorSlug: 'negro', salePrice: 10, costPrice: 4, printTime: 60 },
    { printId: soporte._id, materialId: material._id, sku: 'SOP-B', slug: 'soporte-petg-azul', color: 'Azul', colorSlug: 'azul', salePrice: 12, costPrice: 4, printTime: 60 }
  ]);
  hiddenVariant = (await PrintVariant.create({
    printId: borrador._id, materialId: material._id, sku: 'BOR-A', slug: 'borrador-pla-gris', color: 'Gris', colorSlug: 'gris', salePrice: 5, costPrice: 1, printTime: 10
  }));

  const role = await Role.create({ name: 'customer' });
  const [user, otherUser] = await User.create([
    { email: 'ana@test.com', username: 'ana', passwordHash: 'hash', role: role._id },
    { email: 'luis@test.com', username: 'luis', passwordHash: 'hash', role: role._id }
  ]);

  token = signAccessToken(user._id, role._id).token;
  otherToken = signAccessToken(otherUser._id, role._id).token;
}

async function request(method, path, accessToken) {
  const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  const response = await fetch(`${baseUrl}${path}`, { method, headers });
  return { status: response.status, body: await response.json() };
}

const likesPath = (slug) => `/variants/${slug}/likes`;

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri('fusions3d-test'));
  await Promise.all([
    Print.createIndexes(),
    PrintVariant.createIndexes(),
    VariantLike.createIndexes(),
    User.createIndexes()
  ]);
  await seed();

  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api/shop`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  await mongod.stop();
});

test('dar like sin sesión devuelve 401', async () => {
  const { status, body } = await request('POST', likesPath(variantA.slug));

  assert.equal(status, 401);
  assert.equal(body.error.code, 'AUTHENTICATION_REQUIRED');
});

test('consultar el estado sin sesión devuelve 401', async () => {
  const { status } = await request('GET', `${likesPath(variantA.slug)}/me`);

  assert.equal(status, 401);
});

test('un slug de variante con formato inválido devuelve 400', async () => {
  const { status, body } = await request('POST', likesPath('NO VALIDO!'), token);

  assert.equal(status, 400);
  assert.equal(body.error.code, 'VALIDATION_ERROR');
});

test('una variante inexistente devuelve 404', async () => {
  const { status, body } = await request('POST', likesPath('no-existe'), token);

  assert.equal(status, 404);
  assert.equal(body.error.code, 'VARIANT_NOT_FOUND');
});

test('una variante de una impresión no publicada devuelve 404', async () => {
  const { status, body } = await request('POST', likesPath(hiddenVariant.slug), token);

  assert.equal(status, 404);
  assert.equal(body.error.code, 'VARIANT_NOT_FOUND');
});

test('dar like incrementa el contador y marca la variante como liked', async () => {
  const { status, body } = await request('POST', likesPath(variantA.slug), token);

  assert.equal(status, 200);
  assert.deepEqual(body.data, { liked: true, likesCount: 1 });
});

test('dar like dos veces cuenta una sola vez', async () => {
  const { body } = await request('POST', likesPath(variantA.slug), token);

  assert.deepEqual(body.data, { liked: true, likesCount: 1 });
});

test('dos usuarios distintos suman sus likes sobre la misma variante', async () => {
  const { body } = await request('POST', likesPath(variantA.slug), otherToken);

  assert.deepEqual(body.data, { liked: true, likesCount: 2 });
});

test('los likes de una variante no afectan a otra variante de la misma impresión', async () => {
  const { body } = await request('GET', `${likesPath(variantB.slug)}/me`, token);

  assert.deepEqual(body.data, { liked: false });

  const updated = await PrintVariant.findById(variantB._id).lean();
  assert.equal(updated.likesCount, 0);
});

test('el estado del usuario refleja su like', async () => {
  const { body } = await request('GET', `${likesPath(variantA.slug)}/me`, token);

  assert.deepEqual(body.data, { liked: true });
});

test('el detalle de la impresión incluye likesCount por variante', async () => {
  const { body } = await request('GET', '/prints/soporte');
  const variants = Object.fromEntries(body.data.variants.map((variant) => [variant.sku, variant]));

  assert.equal(variants['SOP-A'].likesCount, 2);
  assert.equal(variants['SOP-B'].likesCount, 0);
});

test('quitar like decrementa el contador y no baja de 0', async () => {
  const first = await request('DELETE', likesPath(variantA.slug), token);
  assert.deepEqual(first.body.data, { liked: false, likesCount: 1 });

  const second = await request('DELETE', likesPath(variantA.slug), token);
  assert.deepEqual(second.body.data, { liked: false, likesCount: 1 });

  await request('DELETE', likesPath(variantA.slug), otherToken);
  const updated = await PrintVariant.findById(variantA._id).lean();
  assert.equal(updated.likesCount, 0);

  const again = await request('DELETE', likesPath(variantA.slug), otherToken);
  assert.deepEqual(again.body.data, { liked: false, likesCount: 0 });
});

test('mis likes exige sesión', async () => {
  const response = await fetch(`${baseUrl.replace('/api/shop', '/api/profiles')}/likes`);

  assert.equal(response.status, 401);
});

test('mis likes muestra solo mis variantes visibles, más recientes primero, y pagina', async () => {
  const userId = jwt.decode(token).sub;
  const otherUserId = jwt.decode(otherToken).sub;

  await VariantLike.create([
    { variantId: variantA._id, userId, createdAt: new Date('2026-01-01') },
    { variantId: variantB._id, userId, createdAt: new Date('2026-01-02') },
    { variantId: hiddenVariant._id, userId, createdAt: new Date('2026-01-03') },
    { variantId: variantA._id, userId: otherUserId, createdAt: new Date('2026-01-04') }
  ]);

  try {
    const profileUrl = `${baseUrl.replace('/api/shop', '/api/profiles')}/likes`;
    const all = await fetch(profileUrl, { headers: { Authorization: `Bearer ${token}` } });
    const allBody = await all.json();

    assert.equal(all.status, 200);
    assert.deepEqual(allBody.data.items.map((item) => item.sku), ['SOP-B', 'SOP-A']);
    assert.equal(allBody.data.items[0].printSlug, 'soporte');
    assert.equal(allBody.data.items[0].variantSlug, 'soporte-petg-azul');
    assert.equal(allBody.data.meta.total, 2);

    const second = await fetch(`${profileUrl}?page=2&limit=1`, { headers: { Authorization: `Bearer ${token}` } });
    const secondBody = await second.json();

    assert.deepEqual(secondBody.data.items.map((item) => item.sku), ['SOP-A']);
    assert.equal(secondBody.data.meta.totalPages, 2);
  } finally {
    await VariantLike.deleteMany({});
  }
});
