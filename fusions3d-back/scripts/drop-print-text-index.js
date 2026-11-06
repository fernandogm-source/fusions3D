require('dotenv').config();

const mongoose = require('mongoose');

const APPLY_CHANGES = process.argv.includes('--apply');
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const TEXT_INDEX = 'name_text_description_text';

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
    const prints = mongoose.connection.collection('prints');
    const indexes = await prints.indexes();
    const exists = indexes.some((index) => index.name === TEXT_INDEX);

    console.log(`Base local fusions3d: índice de texto ${TEXT_INDEX} ${exists ? 'presente' : 'no encontrado'}.`);

    if (!exists) {
      console.log('No hay nada que eliminar.');
      return;
    }

    if (!APPLY_CHANGES) {
      console.log('Modo de prueba: no se modificó la base. Añade --apply para eliminar el índice.');
      return;
    }

    await prints.dropIndex(TEXT_INDEX);
    console.log('Índice de texto eliminado. La búsqueda usa ahora expresiones regulares por prefijo.');
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(async (error) => {
  console.error('No se pudo completar la migración:', error.message);
  await mongoose.disconnect();
  process.exitCode = 1;
});
