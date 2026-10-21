require('dotenv').config();

const mongoose = require('mongoose');

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
    const collection = mongoose.connection.collection('print_variants');
    const filter = { name: { $exists: true } };
    const before = await collection.countDocuments(filter);

    console.log(`Base local fusions3d: ${before} variantes contienen el campo name.`);
    if (!APPLY_CHANGES) {
      console.log('Modo de prueba: no se modificaron datos. Añade --apply para quitar el campo.');
      return;
    }

    const result = await collection.updateMany(filter, { $unset: { name: '' } });
    const remaining = await collection.countDocuments(filter);
    console.log(`Migración completada: ${result.modifiedCount} documentos modificados; ${remaining} siguen con name.`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(async (error) => {
  console.error('No se pudo completar la migración:', error.message);
  await mongoose.disconnect();
  process.exitCode = 1;
});
