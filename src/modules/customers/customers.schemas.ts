import { z } from 'zod';

// ===========================================
// VEHICLE TYPES
// ===========================================

export const vehicleTypeEnum = z.enum([
  'HATCH',
  'SEDAN',
  'SUV',
  'PICKUP',
  'COUPE',
  'CONVERTIBLE',
  'VAN',
  'TRUCK',
  'MOTORCYCLE',
  'OTHER',
]);

export type VehicleType = z.infer<typeof vehicleTypeEnum>;

// ===========================================
// VEHICLE SCHEMAS
// ===========================================

export const createVehicleSchema = z.object({
  brand: z
    .string()
    .min(1, 'Marca é obrigatória')
    .max(50, 'Marca deve ter no máximo 50 caracteres')
    .trim(),
  model: z
    .string()
    .min(1, 'Modelo é obrigatório')
    .max(50, 'Modelo deve ter no máximo 50 caracteres')
    .trim(),
  color: z
    .string()
    .min(1, 'Cor é obrigatória')
    .max(30, 'Cor deve ter no máximo 30 caracteres')
    .trim(),
  plate: z
    .string()
    .max(10, 'Placa deve ter no máximo 10 caracteres')
    .optional()
    .nullable()
    .or(z.literal('')),
  year: z
    .number()
    .int()
    .min(1900, 'Ano inválido')
    .max(new Date().getFullYear() + 1, 'Ano inválido')
    .optional()
    .nullable(),
  type: vehicleTypeEnum.default('SEDAN'),
  isDefault: z.boolean().default(false),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;

export const updateVehicleSchema = createVehicleSchema.partial();

export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;

// ===========================================
// CREATE CUSTOMER
// ===========================================

export const createCustomerSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),
  phone: z
    .string()
    .regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, 'Telefone no formato (XX) XXXXX-XXXX'),
  notes: z
    .string()
    .max(500, 'Observações deve ter no máximo 500 caracteres')
    .optional()
    .or(z.literal('')),
  vehicle: createVehicleSchema.optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

// ===========================================
// UPDATE CUSTOMER
// ===========================================

export const updateCustomerSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim()
    .optional(),
  phone: z
    .string()
    .regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, 'Telefone no formato (XX) XXXXX-XXXX')
    .optional(),
  notes: z
    .string()
    .max(500, 'Observações deve ter no máximo 500 caracteres')
    .optional()
    .nullable(),
  vehicle: createVehicleSchema.optional(),
});

export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;

// ===========================================
// VEHICLE ID PARAMS
// ===========================================

export const vehicleIdParamsSchema = z.object({
  id: z.string().cuid('ID de cliente inválido'),
  vehicleId: z.string().cuid('ID de veículo inválido'),
});

export type VehicleIdParams = z.infer<typeof vehicleIdParamsSchema>;

// ===========================================
// CUSTOMER ID PARAMS
// ===========================================

export const customerIdParamsSchema = z.object({
  id: z.string().cuid('ID de cliente inválido'),
});

export type CustomerIdParams = z.infer<typeof customerIdParamsSchema>;

// ===========================================
// SEARCH QUERY
// ===========================================

export const searchCustomerQuerySchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type SearchCustomerQuery = z.infer<typeof searchCustomerQuerySchema>;
