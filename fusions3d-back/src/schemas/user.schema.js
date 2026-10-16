const { z } = require('zod');
const { objectId } = require('./common.schema');

const addressSchema = z.object({
  street: z.string().min(1, 'La calle es obligatoria'),
  city: z.string().min(1, 'La ciudad es obligatoria'),
  state: z.string().optional().default(''),
  postalCode: z.string().min(1, 'El código postal es obligatorio'),
  country: z.string().min(1, 'El país es obligatorio'),
  isDefault: z.boolean().optional().default(false)
});

const createUserSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(100, 'El nombre no puede superar los 100 caracteres'),
  email: z.email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  roles: z.array(objectId('roleId')).optional(),
  addresses: z.array(addressSchema).optional(),
  phone: z.string().trim().max(30, 'El teléfono no puede superar los 30 caracteres').nullable().optional()
});

const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.email('Email inválido').optional(),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').optional(),
  roles: z.array(objectId('roleId')).optional(),
  addresses: z.array(addressSchema).optional(),
  phone: z.string().trim().max(30).nullable().optional()
}).refine((body) => Object.keys(body).length > 0, {
  message: 'Debes enviar al menos un campo para actualizar'
});

const updateUserRolesSchema = z.object({
  roles: z.array(objectId('roleId'), { error: 'El campo roles es obligatorio y debe ser un array' })
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  updateUserRolesSchema
};
