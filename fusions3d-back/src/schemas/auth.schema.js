const { z } = require('zod');
const { usernameSchema } = require('./common.schema');

const loginSchema = z.object({
  email: z.email('Email inválido').trim().toLowerCase(),
  password: z.string().min(1, 'La contraseña es obligatoria')
});

const registerSchema = z.object({
  email: z.email('Email inválido').trim().toLowerCase(),
  username: usernameSchema,
  password: z.string().min(12, 'La contraseña debe tener al menos 12 caracteres')
}).strict();

module.exports = { loginSchema, registerSchema };
