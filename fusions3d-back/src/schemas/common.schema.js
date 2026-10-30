const { z } = require('zod');

const objectIdRegex = /^[a-f\d]{24}$/i;

const objectId = (field = 'ID') => z.string().regex(objectIdRegex, `${field} inválido`);

const usernameSchema = z.string()
  .trim()
  .toLowerCase()
  .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
  .max(30, 'El nombre de usuario no puede superar los 30 caracteres')
  .regex(/^[a-z0-9._-]+$/, 'El nombre de usuario solo puede contener letras, números, puntos, guiones y guiones bajos');

const idParamSchema = z.object({
  id: z.string().regex(objectIdRegex, 'ID inválido')
});

const slugParamSchema = z.object({
  slug: z.string().min(1, 'Slug inválido')
});

const printIdParamSchema = z.object({
  printId: z.string().regex(objectIdRegex, 'printId inválido')
});

module.exports = {
  objectIdRegex,
  objectId,
  usernameSchema,
  idParamSchema,
  slugParamSchema,
  printIdParamSchema
};
