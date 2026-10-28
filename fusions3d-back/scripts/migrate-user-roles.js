require('dotenv').config();

const mongoose = require('mongoose');

const APPLY_CHANGES = process.argv.includes('--apply');
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const ROLE_NAMES = ['ADMIN', 'USER'];

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
    const users = mongoose.connection.collection('users');
    const roles = mongoose.connection.collection('roles');
    const pending = await users.find({ role: { $type: 'string' } }, { projection: { email: 1, role: 1 } }).toArray();

    console.log(`Base local fusions3d: ${pending.length} usuarios tienen el rol como texto.`);
    if (!APPLY_CHANGES) {
      console.log('Modo de prueba: no se modificaron datos. Añade --apply para migrar los roles.');
      return;
    }

    for (const name of ROLE_NAMES) {
      await roles.updateOne(
        { name },
        { $setOnInsert: { name, isActive: true, deletedAt: null } },
        { upsert: true }
      );
    }

    const roleIds = {};
    for (const name of ROLE_NAMES) {
      const saved = await roles.findOne({ name }, { projection: { _id: 1 } });
      roleIds[name] = saved._id;
    }

    let migrated = 0;
    for (const user of pending) {
      const roleId = roleIds[user.role];
      if (!roleId) {
        console.warn(`Se omite ${user.email}: el rol "${user.role}" no existe en la migración.`);
        continue;
      }

      await users.updateOne({ _id: user._id }, { $set: { role: roleId } });
      migrated++;
    }

    console.log(`Migración completada: ${migrated} usuarios actualizados.`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(async (error) => {
  console.error('No se pudo completar la migración:', error.message);
  await mongoose.disconnect();
  process.exitCode = 1;
});
