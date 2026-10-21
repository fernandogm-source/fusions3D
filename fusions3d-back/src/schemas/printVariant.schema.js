const { z } = require('zod');
const { objectId } = require('./common.schema');

const createPrintVariantSchema = z.object({
  printId: objectId('printId'),
  name: z.string().min(1, 'El nombre es obligatorio').max(150, 'El nombre no puede superar los 150 caracteres'),
  materialId: objectId('materialId'),
  color: z.string().min(1, 'El color es obligatorio').max(100, 'El color no puede superar los 100 caracteres'),
  salePrice: z.number().min(0, 'El precio de venta no puede ser negativo'),
  costPrice: z.number().min(0, 'El precio de coste no puede ser negativo'),
  printTime: z.number().min(0, 'El tiempo de impresión no puede ser negativo')
}).strict();

const updatePrintVariantSchema = z.object({
  printId: objectId('printId').optional(),
  name: z.string().min(1).max(150).optional(),
  materialId: objectId('materialId').optional(),
  color: z.string().min(1).max(100).optional(),
  salePrice: z.number().min(0).optional(),
  costPrice: z.number().min(0).optional(),
  printTime: z.number().min(0).optional()
}).strict().refine((body) => Object.keys(body).length > 0, {
  message: 'Debes enviar al menos un campo para actualizar'
});

module.exports = {
  createPrintVariantSchema,
  updatePrintVariantSchema
};
