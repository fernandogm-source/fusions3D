const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
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
const Profile = require('../../src/models/profile.model');
const VariantReview = require('../../src/models/variant-review.model');

let mongod;
let server;
let baseUrl;
let token;
let otherToken;
let adminToken;
let variantA;
let variantB;
let hiddenVariant;
let ownReviewId;
let otherReviewId;

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
    { printId: soporte._id, materialId: material._id, sku: 'SOP-B', slug: 'soporte-pla-azul', color: 'Azul', colorSlug: 'azul', salePrice: 12, costPrice: 4, printTime: 60 }
  ]);
  hiddenVariant = await PrintVariant.create({
    printId: borrador._id, materialId: material._id, sku: 'BOR-A', slug: 'borrador-pla-gris', color: 'Gris', colorSlug: 'gris', salePrice: 5, costPrice: 1, printTime: 10
  });

  const customer = await Role.create({ name: 'customer' });
  const admin = await Role.create({ name: 'ADMIN' });
  const [user, otherUser, adminUser] = await User.create([
    { email: 'ana@test.com', username: 'ana', passwordHash: 'hash', role: customer._id },
    { email: 'luis@test.com', username: 'luis', passwordHash: 'hash', role: customer._id },
    { email: 'admin@test.com', username: 'admin', passwordHash: 'hash', role: admin._id }
  ]);
  await Profile.create({ userId: user._id, name: 'Ana', avatarUrl: 'https://example.com/ana.png' });

  token = signAccessToken(user._id, customer._id).token;
  otherToken = signAccessToken(otherUser._id, customer._id).token;
  adminToken = signAccessToken(adminUser._id, admin._id).token;
}

async function request(method, path, accessToken, body) {
  const headers = { ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  return { status: response.status, body: await response.json() };
}

const reviewsPath = '/prints/soporte/reviews';

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri('fusions3d-test'));
  await Promise.all([
    Print.createIndexes(),
    PrintVariant.createIndexes(),
    VariantReview.createIndexes(),
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

test('escribir un comentario sin sesión devuelve 401', async () => {
  const { status, body } = await request('POST', reviewsPath, null, { variantSlug: 'soporte-pla-negro', rating: 5, comment: 'Genial' });

  assert.equal(status, 401);
  assert.equal(body.success, false);
});

test('una valoración fuera de 1-5 o con decimales devuelve 400', async () => {
  const high = await request('POST', reviewsPath, token, { variantSlug: 'soporte-pla-negro', rating: 6, comment: 'Mucho' });
  const decimal = await request('POST', reviewsPath, token, { variantSlug: 'soporte-pla-negro', rating: 3.5, comment: 'Medio' });

  assert.equal(high.status, 400);
  assert.equal(decimal.status, 400);
});

test('una variante inexistente o de otra impresión devuelve 404', async () => {
  const missing = await request('POST', reviewsPath, token, { variantSlug: 'no-existe', rating: 4, comment: 'Hola' });
  const hidden = await request('POST', reviewsPath, token, { variantSlug: hiddenVariant.slug, rating: 4, comment: 'Hola' });

  assert.equal(missing.status, 404);
  assert.equal(missing.body.error.code, 'VARIANT_NOT_FOUND');
  assert.equal(hidden.status, 404);
});

test('crear un comentario guarda la valoración y actualiza la media de la variante', async () => {
  const { status, body } = await request('POST', reviewsPath, token, {
    variantSlug: 'soporte-pla-negro', rating: 4, comment: '  Muy buena calidad  '
  });

  assert.equal(status, 201);
  assert.equal(body.data.review.rating, 4);
  assert.equal(body.data.review.comment, 'Muy buena calidad');
  assert.equal(body.data.review.username, 'ana');
  assert.equal(body.data.review.avatarUrl, 'https://example.com/ana.png');
  assert.equal(body.data.review.variantColor, 'Negro');
  assert.equal(body.data.variant.ratingAverage, 4);
  assert.equal(body.data.variant.ratingCount, 1);
  ownReviewId = body.data.review._id;
});

test('un usuario solo puede dejar un comentario por variante', async () => {
  const { status, body } = await request('POST', reviewsPath, token, {
    variantSlug: 'soporte-pla-negro', rating: 2, comment: 'Otra vez'
  });

  assert.equal(status, 409);
  assert.equal(body.error.code, 'REVIEW_ALREADY_EXISTS');
});

test('otro usuario puede comentar la misma variante y la media se calcula con 1 decimal de precisión', async () => {
  const { status, body } = await request('POST', reviewsPath, otherToken, {
    variantSlug: 'soporte-pla-negro', rating: 3, comment: 'Correcto'
  });

  assert.equal(status, 201);
  assert.equal(body.data.variant.ratingAverage, 3.5);
  assert.equal(body.data.variant.ratingCount, 2);
  otherReviewId = body.data.review._id;
});

test('la lista pública muestra los comentarios con autor, variante y estrellas', async () => {
  const { status, body } = await request('GET', reviewsPath);

  assert.equal(status, 200);
  assert.equal(body.data.length, 2);
  assert.ok(body.data.every((review) => review.variantSlug && review.username));
});

test('el filtro por estrellas devuelve solo las valoraciones marcadas', async () => {
  const onlyFour = await request('GET', `${reviewsPath}?stars=4`);
  const fourOrThree = await request('GET', `${reviewsPath}?stars=3,4`);

  assert.deepEqual(onlyFour.body.data.map((review) => review.rating), [4]);
  assert.equal(fourOrThree.body.data.length, 2);
});

test('el resumen devuelve cuántos comentarios hay de cada estrella y su porcentaje', async () => {
  const { status, body } = await request('GET', `${reviewsPath}/summary`);
  const byStars = Object.fromEntries(body.data.distribution.map((row) => [row.stars, row]));

  assert.equal(status, 200);
  assert.equal(body.data.total, 2);
  assert.equal(byStars[4].count, 1);
  assert.equal(byStars[4].percentage, 50);
  assert.equal(byStars[3].count, 1);
  assert.equal(byStars[1].percentage, 0);
  assert.equal(body.data.distribution.length, 5);
});

test('un filtro de estrellas no válido devuelve 400', async () => {
  const { status } = await request('GET', `${reviewsPath}?stars=6`);

  assert.equal(status, 400);
});

test('mis comentarios devuelve todas mis valoraciones de la impresión, o una lista vacía', async () => {
  const mine = await request('GET', `${reviewsPath}/me`, token);
  const none = await request('GET', `${reviewsPath}/me`, adminToken);
  const anonymous = await request('GET', `${reviewsPath}/me`);

  assert.equal(mine.status, 200);
  assert.deepEqual(mine.body.data.map((review) => review._id), [ownReviewId]);
  assert.deepEqual(none.body.data, []);
  assert.equal(anonymous.status, 401);
});

test('un usuario puede valorar varias variantes de la misma impresión', async () => {
  const { status, body } = await request('POST', reviewsPath, token, {
    variantSlug: 'soporte-pla-azul', rating: 2, comment: 'La otra variante'
  });
  assert.equal(status, 201);

  const mine = await request('GET', `${reviewsPath}/me`, token);
  assert.equal(mine.body.data.length, 2);

  const removed = await request('DELETE', `/reviews/${body.data.review._id}`, token);
  assert.equal(removed.body.data.variant.ratingCount, 0);
});

test('la ficha de la impresión incluye la media y el número de valoraciones por variante', async () => {
  const { status, body } = await request('GET', '/prints/soporte');
  const variants = Object.fromEntries(body.data.variants.map((variant) => [variant.slug, variant]));

  assert.equal(status, 200);
  assert.equal(variants['soporte-pla-negro'].ratingAverage, 3.5);
  assert.equal(variants['soporte-pla-negro'].ratingCount, 2);
  assert.equal(variants['soporte-pla-azul'].ratingCount, 0);
});

test('una variante creada antes de las valoraciones devuelve media y recuento 0 en la ficha', async () => {
  await PrintVariant.collection.updateOne({ _id: variantB._id }, { $unset: { ratingAverage: '', ratingCount: '' } });

  const { status, body } = await request('GET', '/prints/soporte');
  const variant = body.data.variants.find((item) => item.slug === 'soporte-pla-azul');

  assert.equal(status, 200);
  assert.equal(variant.ratingAverage, 0);
  assert.equal(variant.ratingCount, 0);
});

test('solo el autor puede editar su comentario y al editar se recalcula la media', async () => {
  const forbidden = await request('PATCH', `/reviews/${ownReviewId}`, otherToken, { rating: 1 });
  assert.equal(forbidden.status, 403);

  const { status, body } = await request('PATCH', `/reviews/${ownReviewId}`, token, { rating: 5, comment: 'Mejor de lo esperado' });

  assert.equal(status, 200);
  assert.equal(body.data.review.rating, 5);
  assert.equal(body.data.review.comment, 'Mejor de lo esperado');
  assert.equal(body.data.variant.ratingAverage, 4);
});

test('editar sin ningún campo devuelve 400', async () => {
  const { status } = await request('PATCH', `/reviews/${ownReviewId}`, token, {});

  assert.equal(status, 400);
});

test('el panel de administración lista todos los comentarios con impresión, filtro y paginación', async () => {
  const adminBase = baseUrl.replace('/api/shop', '/api');
  const all = await fetch(`${adminBase}/reviews`, { headers: { Authorization: `Bearer ${adminToken}` } });
  const allBody = await all.json();
  const threes = await fetch(`${adminBase}/reviews?stars=3&limit=1`, { headers: { Authorization: `Bearer ${adminToken}` } });
  const threesBody = await threes.json();
  const customer = await fetch(`${adminBase}/reviews`, { headers: { Authorization: `Bearer ${token}` } });

  assert.equal(all.status, 200);
  assert.equal(allBody.data.meta.total, 2);
  assert.equal(allBody.data.items[0].printName, 'Soporte');
  assert.equal(threesBody.data.items.length, 1);
  assert.equal(threesBody.data.items[0].rating, 3);
  assert.equal(threesBody.data.meta.totalPages, 1);
  assert.equal(customer.status, 403);
});

test('el panel lista las impresiones con comentarios y filtra los comentarios por impresión', async () => {
  const adminBase = baseUrl.replace('/api/shop', '/api');
  const headers = { Authorization: `Bearer ${adminToken}` };

  const prints = await (await fetch(`${adminBase}/reviews/prints`, { headers })).json();
  const soporte = prints.data.find((print) => print.slug === 'soporte');
  const filtered = await (await fetch(`${adminBase}/reviews?printId=${soporte._id}`, { headers })).json();
  const otherPrint = await (await fetch(`${adminBase}/reviews?printId=${variantA._id}`, { headers })).json();

  assert.equal(prints.data.length, 1);
  assert.equal(soporte.reviewCount, 2);
  assert.equal(soporte.ratingAverage, 4);
  assert.equal(filtered.data.meta.total, 2);
  assert.equal(filtered.data.print.name, 'Soporte');
  assert.equal(otherPrint.data.meta.total, 0);
  assert.equal(otherPrint.data.print, null);
});

test('un usuario no puede borrar el comentario de otro', async () => {
  const { status, body } = await request('DELETE', `/reviews/${otherReviewId}`, token);

  assert.equal(status, 403);
  assert.equal(body.error.code, 'FORBIDDEN');
});

test('el autor borra su comentario y la media se recalcula', async () => {
  const { status, body } = await request('DELETE', `/reviews/${ownReviewId}`, token);

  assert.equal(status, 200);
  assert.equal(body.data.removed, true);
  assert.equal(body.data.variant.ratingCount, 1);
  assert.equal(body.data.variant.ratingAverage, 3);
});

test('un admin puede borrar cualquier comentario desde el panel', async () => {
  const adminBase = baseUrl.replace('/api/shop', '/api');
  const response = await fetch(`${adminBase}/reviews/${otherReviewId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const body = await response.json();
  const status = response.status;

  assert.equal(status, 200);
  assert.equal(body.data.variant.ratingCount, 0);
  assert.equal(body.data.variant.ratingAverage, 0);
  assert.equal(await VariantReview.countDocuments({}), 0);
});

test('borrar un comentario inexistente devuelve 404', async () => {
  const { status, body } = await request('DELETE', `/reviews/${otherReviewId}`, adminToken);

  assert.equal(status, 404);
  assert.equal(body.error.code, 'REVIEW_NOT_FOUND');
});
