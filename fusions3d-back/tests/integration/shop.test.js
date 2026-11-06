const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../../src/app');
const Category = require('../../src/models/category.model');
const Material = require('../../src/models/material.model');
const Print = require('../../src/models/print.model');
const PrintVariant = require('../../src/models/printVariant.model');
const Image = require('../../src/models/image.model');

let mongod;
let server;
let baseUrl;

async function seed() {
  const [figuras, hogar, inactiva] = await Category.create([
    { name: 'Figuras', slug: 'figuras', status: 'published', isActive: true },
    { name: 'Hogar', slug: 'hogar', status: 'published', isActive: true },
    { name: 'Oculta', slug: 'oculta', status: 'published', isActive: false }
  ]);

  const [pla, petg, retirado] = await Material.create([
    { name: 'PLA', slug: 'pla', isActive: true },
    { name: 'PETG', slug: 'petg', isActive: true },
    { name: 'ABS', slug: 'abs', isActive: false }
  ]);

  const [soporte, maceta, borrador, figuraOculta] = await Print.create([
    { name: 'Soporte para móvil', slug: 'soporte-para-movil', description: 'Soporte de escritorio', categoryId: hogar._id, status: 'published', isActive: true, createdAt: new Date('2026-01-03') },
    { name: 'Maceta geométrica', slug: 'maceta-geometrica', description: 'Maceta decorativa', categoryId: hogar._id, status: 'published', isActive: true, createdAt: new Date('2026-01-02') },
    { name: 'Figura borrador', slug: 'figura-borrador', description: 'Sin publicar', categoryId: figuras._id, status: 'draft', isActive: true, createdAt: new Date('2026-01-04') },
    { name: 'Figura oculta', slug: 'figura-oculta', description: 'Categoría inactiva', categoryId: inactiva._id, status: 'published', isActive: true, createdAt: new Date('2026-01-05') }
  ]);

  const [figura] = await Print.create([
    { name: 'Figura dragón', slug: 'figura-dragon', description: 'Dragón articulado', categoryId: figuras._id, status: 'published', isActive: true, createdAt: new Date('2026-01-01') }
  ]);

  await PrintVariant.create([
    { printId: soporte._id, materialId: pla._id, sku: 'SOP-PLA-NEG', color: 'Negro', colorSlug: 'negro', colorHex: '#1F1F1F', salePrice: 12.5, costPrice: 4, printTime: 180 },
    { printId: soporte._id, materialId: petg._id, sku: 'SOP-PET-AZU', color: 'Azul', colorSlug: 'azul', colorHex: '#2563EB', salePrice: 15.9, costPrice: 5, printTime: 210 },
    { printId: maceta._id, materialId: petg._id, sku: 'MAC-PET-BLA', color: 'Blanco', colorSlug: 'blanco', colorHex: '#F5F5F5', salePrice: 18.9, costPrice: 6, printTime: 360 },
    { printId: figura._id, materialId: pla._id, sku: 'FIG-PLA-NEG', color: 'Negro', colorSlug: 'negro', colorHex: '#1F1F1F', salePrice: 24.9, costPrice: 9, printTime: 540 },
    { printId: figura._id, materialId: retirado._id, sku: 'FIG-ABS-NEG', color: 'Negro', colorSlug: 'negro', colorHex: '#1F1F1F', salePrice: 3, costPrice: 1, printTime: 60 },
    { printId: borrador._id, materialId: pla._id, sku: 'BOR-PLA-GRI', color: 'Gris', colorSlug: 'gris', colorHex: null, salePrice: 1, costPrice: 1, printTime: 10 },
    { printId: figuraOculta._id, materialId: pla._id, sku: 'OCU-PLA-GRI', color: 'Gris', colorSlug: 'gris', colorHex: null, salePrice: 2, costPrice: 1, printTime: 10 }
  ]);

  await Image.create([
    { entityType: 'Print', entityId: soporte._id, imageUrl: 'https://img.test/soporte.jpg', altText: 'Soporte', position: 0, isCover: true, status: 'published', isActive: true },
    { entityType: 'Category', entityId: hogar._id, imageUrl: 'https://img.test/hogar.jpg', altText: 'Hogar', position: 0, isCover: true, status: 'published', isActive: true }
  ]);
}

async function get(path) {
  const response = await fetch(`${baseUrl}${path}`);
  return { status: response.status, body: await response.json() };
}

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri('fusions3d-test'));
  await Promise.all([Print.createIndexes(), PrintVariant.createIndexes()]);
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

test('el listado solo incluye impresiones publicadas con categoría activa', async () => {
  const { status, body } = await get('/prints');
  const slugs = body.data.map((print) => print.slug).sort();

  assert.equal(status, 200);
  assert.deepEqual(slugs, ['figura-dragon', 'maceta-geometrica', 'soporte-para-movil']);
  assert.equal(body.meta.total, 3);
});

test('el listado devuelve precios y materiales de cada impresión', async () => {
  const { body } = await get('/prints?category=hogar&sort=name');
  const soporte = body.data.find((print) => print.slug === 'soporte-para-movil');

  assert.equal(soporte.minPrice, 12.5);
  assert.equal(soporte.maxPrice, 15.9);
  assert.deepEqual(soporte.materials.map((material) => material.slug).sort(), ['petg', 'pla']);
  assert.equal(soporte.cover.imageUrl, 'https://img.test/soporte.jpg');
  assert.equal(soporte.costPrice, undefined);
});

test('filtra por categoría con slug', async () => {
  const { body } = await get('/prints?category=figuras');

  assert.deepEqual(body.data.map((print) => print.slug), ['figura-dragon']);
});

test('un slug desconocido devuelve listado vacío sin error', async () => {
  const { status, body } = await get('/prints?category=no-existe');

  assert.equal(status, 200);
  assert.deepEqual(body.data, []);
  assert.equal(body.meta.total, 0);
});

test('filtra por material con slug', async () => {
  const { body } = await get('/prints?material=petg');

  assert.deepEqual(body.data.map((print) => print.slug).sort(), ['maceta-geometrica', 'soporte-para-movil']);
});

test('filtra por color con slug y recalcula el precio sobre variantes que cumplen el filtro', async () => {
  const { body } = await get('/prints?color=negro&sort=name');
  const soporte = body.data.find((print) => print.slug === 'soporte-para-movil');
  const figura = body.data.find((print) => print.slug === 'figura-dragon');

  assert.deepEqual(body.data.map((print) => print.slug).sort(), ['figura-dragon', 'soporte-para-movil']);
  assert.equal(soporte.minPrice, 12.5);
  assert.equal(soporte.maxPrice, 12.5);
  assert.equal(figura.minPrice, 24.9);
});

test('el rango de precio descarta variantes fuera de los límites', async () => {
  const { body } = await get('/prints?minPrice=10&maxPrice=20');

  assert.deepEqual(body.data.map((print) => print.slug).sort(), ['maceta-geometrica', 'soporte-para-movil']);
});

test('combina varios filtros con AND entre tipos', async () => {
  const { body } = await get('/prints?category=hogar,figuras&material=pla&color=negro');

  assert.deepEqual(body.data.map((print) => print.slug).sort(), ['figura-dragon', 'soporte-para-movil']);
  assert.ok(body.data.every((print) => print.materials.some((material) => material.slug === 'pla')));
});

test('la búsqueda por prefijo encuentra impresiones por nombre', async () => {
  const { body } = await get('/prints?q=sop');

  assert.deepEqual(body.data.map((print) => print.slug), ['soporte-para-movil']);
});

test('la búsqueda funciona con una sola letra', async () => {
  const { body } = await get('/prints?q=s');

  assert.deepEqual(body.data.map((print) => print.slug), ['soporte-para-movil']);
});

test('la búsqueda no distingue mayúsculas ni tildes', async () => {
  const mayusculas = await get('/prints?q=DRAGON');
  const tildes = await get(`/prints?q=${encodeURIComponent('dragón')}`);

  assert.deepEqual(mayusculas.body.data.map((print) => print.slug), ['figura-dragon']);
  assert.deepEqual(tildes.body.data.map((print) => print.slug), ['figura-dragon']);
});

test('la búsqueda también encuentra palabras de la descripción', async () => {
  const { body } = await get('/prints?q=escritorio');

  assert.deepEqual(body.data.map((print) => print.slug), ['soporte-para-movil']);
});

test('la búsqueda con varias palabras exige que todas coincidan', async () => {
  const coincide = await get(`/prints?q=${encodeURIComponent('maceta decorativa')}`);
  const noCoincide = await get(`/prints?q=${encodeURIComponent('soporte tablet')}`);

  assert.deepEqual(coincide.body.data.map((print) => print.slug), ['maceta-geometrica']);
  assert.deepEqual(noCoincide.body.data, []);
});

test('la búsqueda ordena por relevancia: primero el nombre que empieza por el texto', async () => {
  const { body } = await get('/prints?q=m');

  assert.deepEqual(body.data.map((print) => print.slug), ['maceta-geometrica', 'soporte-para-movil']);
});

test('la búsqueda escapa los caracteres de expresión regular', async () => {
  const { body } = await get(`/prints?q=${encodeURIComponent('.*')}`);

  assert.deepEqual(body.data, []);
});

test('pagina el listado con offset', async () => {
  const first = await get('/prints?sort=name&limit=2&page=1');
  const second = await get('/prints?sort=name&limit=2&page=2');

  assert.equal(first.body.data.length, 2);
  assert.equal(second.body.data.length, 1);
  assert.equal(first.body.meta.totalPages, 2);
  assert.equal(second.body.meta.page, 2);
});

test('rechaza parámetros inválidos con 400', async () => {
  const { status, body } = await get('/prints?minPrice=30&maxPrice=5');

  assert.equal(status, 400);
  assert.equal(body.error.code, 'VALIDATION_ERROR');
});

test('el detalle devuelve variantes con hex y material, sin coste', async () => {
  const { status, body } = await get('/prints/soporte-para-movil');
  const negro = body.data.variants.find((variant) => variant.colorSlug === 'negro');

  assert.equal(status, 200);
  assert.equal(body.data.minPrice, 12.5);
  assert.equal(body.data.maxPrice, 15.9);
  assert.equal(negro.colorHex, '#1F1F1F');
  assert.equal(negro.materialId.slug, 'pla');
  assert.equal(negro.costPrice, undefined);
});

test('el detalle de un borrador devuelve 404', async () => {
  const { status } = await get('/prints/figura-borrador');

  assert.equal(status, 404);
});

test('filters devuelve categorías, materiales, colores con slug y hex, y rango de precios', async () => {
  const { body } = await get('/filters');
  const negro = body.data.colors.find((color) => color.slug === 'negro');

  assert.deepEqual(body.data.priceRange, { min: 12.5, max: 24.9 });
  assert.equal(negro.hex, '#1F1F1F');
  assert.equal(negro.count, 2);
  assert.ok(body.data.materials.every((material) => material.slug));
  assert.ok(!body.data.colors.some((color) => color.slug === 'gris'));
});

test('home devuelve las cuatro secciones', async () => {
  const { status, body } = await get('/home');

  assert.equal(status, 200);
  assert.ok(Array.isArray(body.data.categories));
  assert.ok(Array.isArray(body.data.materials));
  assert.ok(Array.isArray(body.data.colors));
  assert.equal(body.data.latestPrints[0].slug, 'soporte-para-movil');
});
