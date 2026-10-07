const { z } = require('zod');

const objectIdRegex = /^[a-f\d]{24}$/i;

const createPrintSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(150, 'El nombre no puede superar los 150 caracteres'),
  descripcion: z.string().min(1, 'La descripción es obligatoria').max(2000, 'La descripción no puede superar los 2000 caracteres'),
  precio_venta: z.number().min(0, 'El precio de venta no puede ser negativo'),
  precio_coste: z.number().min(0, 'El precio de coste no puede ser negativo'),
  tiempo_impresion: z.number().min(0, 'El tiempo de impresión no puede ser negativo'),
  status: z.enum(['published', 'draft', 'archived']).optional()
});

const updatePrintSchema = z.object({
  nombre: z.string().min(1).max(150).optional(),
  descripcion: z.string().min(1).max(2000).optional(),
  precio_venta: z.number().min(0).optional(),
  precio_coste: z.number().min(0).optional(),
  tiempo_impresion: z.number().min(0).optional(),
  status: z.enum(['published', 'draft', 'archived', 'suspended']).optional()
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
