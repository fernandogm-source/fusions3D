const { z } = require('zod');

const objectIdRegex = /^[a-f\d]{24}$/i;

const objectId = (field = 'ID') => z.string().regex(objectIdRegex, `${field} inválido`);

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
  idParamSchema,
  slugParamSchema,
  printIdParamSchema
};
