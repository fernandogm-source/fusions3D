require('dotenv').config();

const mongoose = require('mongoose');

const APPLY_CHANGES = process.argv.includes('--apply');
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const MIN_LENGTH = 3;
const MAX_LENGTH = 30;
const FALLBACK_BASE = 'usuario';

function buildBaseUsername(email) {
  const localPart = String(email).split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '');
  const trimmed = localPart.slice(0, MAX_LENGTH);
  return trimmed.length >= MIN_LENGTH ? trimmed : FALLBACK_BASE;
}

function withSuffix(base, number) {
  const suffix = `-${number}`;
  return `${base.slice(0, MAX_LENGTH - suffix.length)}${suffix}`;
}

function allocateUsername(base, taken) {
  let candidate = base;
  let number = 2;

  while (taken.has(candidate)) {
    candidate = withSuffix(base, number);
    number++;
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
    const users = mongoose.connection.collection('users');
    const missingUsername = {
      $or: [{ username: { $exists: false } }, { username: null }, { username: '' }]
    };

    const pending = await users
      .find(missingUsername, { projection: { email: 1 } })
      .sort({ _id: 1 })
      .toArray();
    const taken = new Set(
      (await users.distinct('username', { username: { $nin: [null, ''] } })).map((value) => value.toLowerCase())
    );

    const plan = pending.map((user) => ({
      _id: user._id,
      email: user.email,
      username: allocateUsername(buildBaseUsername(user.email), taken)
    }));

    console.log(`Base local fusions3d: ${plan.length} usuarios sin username.`);
    for (const item of plan) {
      console.log(`  ${item.email} -> ${item.username}`);
    }

    if (!APPLY_CHANGES) {
      console.log('Modo de prueba: no se modificaron datos. Añade --apply para asignar los usernames.');
      return;
    }

    for (const item of plan) {
      await users.updateOne({ _id: item._id }, { $set: { username: item.username } });
    }

    await users.createIndex({ username: 1 }, { unique: true });
    console.log(`Migración completada: ${plan.length} usuarios actualizados y índice único creado.`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(async (error) => {
  console.error('No se pudo completar la migración:', error.message);
  await mongoose.disconnect();
  process.exitCode = 1;
});
