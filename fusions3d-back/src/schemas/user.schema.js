const { z } = require('zod');
const { objectId } = require('./common.schema');

const createUserSchema = z.object({
  email: z.email('Email inválido').trim().toLowerCase(),
  password: z.string().min(12, 'La contraseña debe tener al menos 12 caracteres'),
  role: objectId('Rol').optional()
}).strict();

const updateUserSchema = z.object({
  email: z.email('Email inválido').trim().toLowerCase().optional(),
  password: z.string().min(12, 'La contraseña debe tener al menos 12 caracteres').optional(),
  role: objectId('Rol').optional()
}).strict().refine((body) => Object.keys(body).length > 0, {
  message: 'Debes enviar al menos un campo para actualizar'
});

const updateUserRoleSchema = z.object({
  role: objectId('Rol')
}).strict();

module.exports = {
  createUserSchema,
  updateUserSchema,
  updateUserRoleSchema
};
