const argon2 = require('argon2');

async function hashPassword(password) {
  if (typeof password !== 'string' || password.length === 0) {
    throw new TypeError('La contraseña debe ser una cadena no vacía');
  }

  return argon2.hash(password, { type: argon2.argon2id });
}

async function verifyPassword(password, passwordHash) {
  if (typeof password !== 'string' || typeof passwordHash !== 'string' || !passwordHash) {
    return false;
  }

  try {
    return await argon2.verify(passwordHash, password);
  } catch (_error) {
    return false;
  }
}

module.exports = { hashPassword, verifyPassword };
