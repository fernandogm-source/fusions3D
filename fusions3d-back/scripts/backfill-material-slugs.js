require('dotenv').config();

const mongoose = require('mongoose');
const { toSlug } = require('../src/utils/slug.util');

const APPLY_CHANGES = process.argv.includes('--apply');
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

function allocateSlug(base, taken) {
  let candidate = base;
  let counter = 1;

  while (taken.has(candidate)) {
    candidate = `${base}-${counter}`;
    counter++;
  }

  taken.add(candidate);
  return candidate;
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
    const materials = mongoose.connection.collection('materials');
    const pending = await materials
      .find({ $or: [{ slug: { $exists: false } }, { slug: null }, { slug: '' }] }, { projection: { name: 1 } })
      .sort({ _id: 1 })
      .toArray();
    const taken = new Set(
      (await materials.distinct('slug', { slug: { $nin: [null, ''] } }))
    );

    const plan = pending.map((material) => ({
      _id: material._id,
      name: material.name,
      slug: allocateSlug(toSlug(material.name), taken)
    }));

    console.log(`Base local fusions3d: ${plan.length} materiales sin slug.`);
    for (const item of plan) {
      console.log(`  ${item.name} -> ${item.slug}`);
    }

    if (!APPLY_CHANGES) {
      console.log('Modo de prueba: no se modificaron datos. Añade --apply para asignar los slugs.');
      return;
    }

    for (const item of plan) {
      await materials.updateOne({ _id: item._id }, { $set: { slug: item.slug } });
    }

    await materials.createIndex({ slug: 1 }, { unique: true, sparse: true });
    console.log(`Migración completada: ${plan.length} materiales actualizados y índice único creado.`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(async (error) => {
  console.error('No se pudo completar la migración:', error.message);
  await mongoose.disconnect();
  process.exitCode = 1;
});
