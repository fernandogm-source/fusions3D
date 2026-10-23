const { z } = require('zod');

const objectIdRegex = /^[a-f\d]{24}$/i;
const imageUrlsSchema = z.array(
  z.string().url('Cada imagen debe tener una URL válida').refine(
    (url) => /^https?:\/\//i.test(url),
    'La URL de la imagen debe usar HTTP o HTTPS'
  )
);

const createPrintSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(150, 'El nombre no puede superar los 150 caracteres'),
  description: z.string().min(1, 'La descripción es obligatoria').max(2000, 'La descripción no puede superar los 2000 caracteres'),
  categoryId: z.string().regex(objectIdRegex, 'categoryId inválido'),
  status: z.enum(['published', 'draft', 'archived', 'suspended']).optional(),
  images: imageUrlsSchema.optional()
});

const updatePrintSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  description: z.string().min(1).max(2000).optional(),
  categoryId: z.string().regex(objectIdRegex, 'categoryId inválido').optional(),
  status: z.enum(['published', 'draft', 'archived', 'suspended']).optional(),
  images: imageUrlsSchema.optional()
}).refine((body) => Object.keys(body).length > 0, {
  message: 'Debes enviar al menos un campo para actualizar'
});

const activeSchema = z.object({
  active: z.boolean({ required_error: 'El campo active es obligatorio' })
});

const idParamSchema = z.object({
  id: z.string().regex(objectIdRegex, 'ID inválido')
});

const slugParamSchema = z.object({
  slug: z.string().min(1, 'Slug inválido')
});

module.exports = {
  createPrintSchema,
  updatePrintSchema,
  activeSchema,
  idParamSchema,
  slugParamSchema
};
