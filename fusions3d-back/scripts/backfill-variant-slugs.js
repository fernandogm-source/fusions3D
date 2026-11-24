require('dotenv').config();

const mongoose = require('mongoose');
const { toSlug } = require('../src/utils/slug.util');

const APPLY_CHANGES = process.argv.includes('--apply');
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

async function uniqueSlug(variants, base) {
  let slug = base;
  let counter = 1;

  while (await variants.countDocuments({ slug }, { limit: 1 })) {
    slug = `${base}-${counter}`;
    counter++;
  }

  return slug;
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI no está definida');
  }

  const parsedUri = new URL(uri);
  const databaseName = decodeURIComponent(parsedUri.pathname.replace(/^\//, '').split('/')[0]);
  if (!LOCAL_HOSTS.has(parsedUri.hostname) || databaseName !== 'fusions3d') {
    throw new Error('Esta migración solo se permite contra localhost y la base fusions3d');
  }

  await mongoose.connect(uri);

  try {
    const db = mongoose.connection.db;
    const variants = db.collection('print_variants');
    const prints = db.collection('prints');
    const materials = db.collection('materials');
    const missing = { $or: [{ slug: { $exists: false } }, { slug: null }, { slug: '' }] };

    const pending = await variants.find(missing).toArray();
    console.log(`Base local fusions3d: ${pending.length} variantes sin slug.`);

    const changes = [];
    for (const variant of pending) {
      const print = await prints.findOne({ _id: variant.printId });
      const material = await materials.findOne({ _id: variant.materialId });
      if (!print || !material) continue;

      const base = `${print.slug}-${material.slug}-${toSlug(variant.color)}`;
      changes.push({ _id: variant._id, slug: base });
    }

    for (const change of changes) {
      console.log(`  ${change.slug}`);
    }

    if (!APPLY_CHANGES) {
      console.log('Modo de prueba: no se modificaron datos. Añade --apply para asignar los slugs.');
      return;
    }

    for (const change of changes) {
      const slug = await uniqueSlug(variants, change.slug);
      await variants.updateOne({ _id: change._id }, { $set: { slug } });
    }

    await variants.createIndex({ slug: 1 }, { unique: true, sparse: true });
    console.log(`Migración completada: ${changes.length} variantes actualizadas.`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(async (error) => {
  console.error('No se pudo completar la migración:', error.message);
  await mongoose.disconnect();
  process.exitCode = 1;
});
