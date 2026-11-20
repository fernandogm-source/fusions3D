const { z } = require('zod');

const printDescriptionRequestSchema = z.object({
  name: z.string().trim().min(1).max(120),
  category: z.string().trim().min(1, 'Necesitas seleccionar una categoría para generar la descripción con IA').max(80),
  locale: z.enum(['es']).default('es')
});

const printDescriptionResponseSchema = z.object({
  description: z.string().min(1).max(1500),
  shortDescription: z.string().min(1).max(160)
});

module.exports = { printDescriptionRequestSchema, printDescriptionResponseSchema };
