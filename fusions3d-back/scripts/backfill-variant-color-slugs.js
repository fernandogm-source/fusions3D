require('dotenv').config();

const mongoose = require('mongoose');
const { toSlug } = require('../src/utils/slug.util');

const APPLY_CHANGES = process.argv.includes('--apply');
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

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
    const variants = mongoose.connection.collection('print_variants');
    const missing = { $or: [{ colorSlug: { $exists: false } }, { colorSlug: null }, { colorSlug: '' }] };

    const colors = (await variants.distinct('color', missing)).filter(Boolean);
    const count = await variants.countDocuments(missing);

    console.log(`Base local fusions3d: ${count} variantes sin colorSlug (${colors.length} colores distintos).`);
    for (const color of colors) {
      console.log(`  ${color} -> ${toSlug(color)}`);
    }

    if (!APPLY_CHANGES) {
      console.log('Modo de prueba: no se modificaron datos. Añade --apply para asignar los colorSlug.');
      return;
    }

    for (const color of colors) {
      await variants.updateMany(
        { ...missing, color },
        { $set: { colorSlug: toSlug(color) } }
      );
    }

    await variants.dropIndex('materialId_1_color_1_isActive_1').catch(() => {});
    await variants.createIndex({ materialId: 1, colorSlug: 1, isActive: 1 });
    console.log(`Migración completada: ${count} variantes actualizadas.`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(async (error) => {
  console.error('No se pudo completar la migración:', error.message);
  await mongoose.disconnect();
  process.exitCode = 1;
});
