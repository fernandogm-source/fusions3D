const { z } = require('zod');
const { objectId, usernameSchema } = require('./common.schema');

const addressSchema = z.object({
  street: z.string().trim().min(1, 'La calle es obligatoria'),
  city: z.string().trim().min(1, 'La ciudad es obligatoria'),
  state: z.string().trim().optional().default(''),
  postalCode: z.string().trim().min(1, 'El código postal es obligatorio'),
  country: z.string().trim().min(1, 'El país es obligatorio'),
  isDefault: z.boolean().optional().default(false)
}).strict();

const updateProfileSchema = z.object({
  username: usernameSchema.optional(),
  name: z.string().trim().min(1).max(100).optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  avatarUrl: z.url({ protocol: /^https?$/ }).max(2048).nullable().optional(),
  addresses: z.array(addressSchema).optional()
}).strict().refine((body) => Object.keys(body).length > 0, {
  message: 'Debes enviar al menos un campo para actualizar'
});

const profileTargetQuerySchema = z.object({
  userId: objectId('userId').optional()
}).strict();

module.exports = { updateProfileSchema, profileTargetQuerySchema };
