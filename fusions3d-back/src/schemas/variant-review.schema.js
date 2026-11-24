const { z } = require('zod');
const { variantSlugParamSchema, objectId } = require('./common.schema');

const rating = z.number().int('La valoración debe ser un número entero').min(1).max(5);
const comment = z.string().trim().min(1, 'El comentario no puede estar vacío').max(1000, 'El comentario no puede superar los 1000 caracteres');

const createReviewSchema = z.object({
  variantSlug: variantSlugParamSchema.shape.variantSlug,
  rating,
  comment
});

const updateReviewSchema = z.object({
  rating: rating.optional(),
  comment: comment.optional()
}).refine((data) => data.rating !== undefined || data.comment !== undefined, {
  message: 'Indica al menos un campo para actualizar'
});

const reviewsQuerySchema = z.object({
  stars: z.string()
    .regex(/^[1-5](,[1-5])*$/, 'El filtro de estrellas debe ser una lista de valores del 1 al 5')
    .optional()
    .transform((value) => (value ? [...new Set(value.split(',').map(Number))].sort() : []))
});

const adminReviewsQuerySchema = reviewsQuerySchema.extend({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  printId: objectId('printId').optional()
});

module.exports = { createReviewSchema, updateReviewSchema, reviewsQuerySchema, adminReviewsQuerySchema };
