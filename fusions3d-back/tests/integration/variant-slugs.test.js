const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const Category = require('../../src/models/category.model');
const Material = require('../../src/models/material.model');
const Print = require('../../src/models/print.model');
const PrintVariant = require('../../src/models/printVariant.model');
const printService = require('../../src/services/print.service');
const materialService = require('../../src/services/material.service');
const variantService = require('../../src/services/printVariant.service');

let mongod;
let category;
let material;
let print;

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri('fusions3d-slugs'));
  await Promise.all([Print.createIndexes(), PrintVariant.createIndexes()]);

  category = await Category.create({ name: 'Hogar', slug: 'hogar', status: 'published', isActive: true });
  material = await Material.create({ name: 'PLA', slug: 'pla', isActive: true });
  print = await Print.create({
    name: 'Soporte para móvil', slug: 'soporte-para-movil', description: 'Soporte', categoryId: category._id,
    status: 'published', isActive: true
  });
});

after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

test('la variante recibe un slug con impresión, material y color', async () => {
  const variant = await variantService.create({
    printId: print._id, materialId: material._id, color: 'Azul Cielo', salePrice: 10, costPrice: 4, printTime: 60
  });

  assert.equal(variant.slug, 'soporte-para-movil-pla-azul-cielo');
});

test('dos variantes con los mismos datos reciben slugs distintos', async () => {
  const second = await variantService.create({
    printId: print._id, materialId: material._id, color: 'Azul Cielo', salePrice: 11, costPrice: 4, printTime: 60
  });

  assert.equal(second.slug, 'soporte-para-movil-pla-azul-cielo-1');
});

test('renombrar la impresión regenera el slug y el sku de sus variantes', async () => {
  await printService.update(print._id, { name: 'Soporte de sobremesa' });

  const variants = await PrintVariant.find({ printId: print._id }).sort({ _id: 1 }).lean();

  assert.equal(variants[0].slug, 'soporte-de-sobremesa-pla-azul-cielo');
  assert.equal(variants[1].slug, 'soporte-de-sobremesa-pla-azul-cielo-1');
  assert.equal(variants[0].sku, 'SOPSOB-PLA-AZU');
});

test('renombrar el material regenera el slug de sus variantes', async () => {
  await materialService.update(material._id, { name: 'PLA Mate' });

  const variant = await PrintVariant.findOne({ materialId: material._id }).sort({ _id: 1 }).lean();

  assert.equal(variant.slug, 'soporte-de-sobremesa-pla-mate-azul-cielo');
});

test('cambiar el color de una variante regenera su slug sin colisionar consigo misma', async () => {
  const variant = await PrintVariant.findOne({ printId: print._id }).sort({ _id: 1 }).lean();

  const updated = await variantService.update(variant._id, { color: 'Verde' });

  assert.equal(updated.slug, 'soporte-de-sobremesa-pla-mate-verde');
});
