const { z } = require('zod');

const createRoleSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(50, 'El nombre no puede superar los 50 caracteres')
});

const updateRoleSchema = z.object({
  name: z.string().min(1).max(50).optional()
}).refine((body) => Object.keys(body).length > 0, {
  message: 'Debes enviar al menos un campo para actualizar'
});

module.exports = {
  createRoleSchema,
  updateRoleSchema
};
