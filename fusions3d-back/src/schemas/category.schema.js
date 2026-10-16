const { z } = require('zod');

const statusEnum = z.enum(['published', 'draft', 'archived', 'suspended']);

const createCategorySchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(100, 'El nombre no puede superar los 100 caracteres'),
  status: statusEnum.optional()
});

const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  status: statusEnum.optional()
}).refine((body) => Object.keys(body).length > 0, {
  message: 'Debes enviar al menos un campo para actualizar'
});

module.exports = {
  createCategorySchema,
  updateCategorySchema
};
