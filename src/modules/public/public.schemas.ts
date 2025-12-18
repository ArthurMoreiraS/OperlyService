import { z } from 'zod';

// ===========================================
// SLUG PARAMS
// ===========================================

export const publicSlugParamsSchema = z.object({
  slug: z
    .string()
    .min(3, 'Slug inválido')
    .max(50, 'Slug inválido')
    .regex(/^[a-z0-9-]+$/, 'Slug inválido'),
});

export type PublicSlugParams = z.infer<typeof publicSlugParamsSchema>;

// ===========================================
// AVAILABLE SLOTS QUERY
// ===========================================

export const publicSlotsQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data no formato YYYY-MM-DD'),
  serviceId: z.string().cuid('ID de serviço inválido').optional(),
});

export type PublicSlotsQuery = z.infer<typeof publicSlotsQuerySchema>;

// ===========================================
// VEHICLE TYPE ENUM (for public booking)
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

// ===========================================
// BOOK APPOINTMENT (cliente sem login)
// ===========================================

export const publicBookSchema = z.object({
  customerName: z
    .string()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),
  customerPhone: z
    .string()
    .min(10, 'Telefone deve ter no mínimo 10 dígitos')
    .max(20, 'Telefone deve ter no máximo 20 caracteres'),
  serviceId: z.string().cuid('ID de serviço inválido'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data no formato YYYY-MM-DD'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Horário no formato HH:mm'),
  notes: z
    .string()
    .max(500, 'Observações deve ter no máximo 500 caracteres')
    .optional()
    .or(z.literal('')),
  // Dados do veículo (opcional para clientes existentes, obrigatório para novos)
  vehicle: z.object({
    brand: z.string().min(1, 'Marca é obrigatória').max(50).trim(),
    model: z.string().min(1, 'Modelo é obrigatório').max(50).trim(),
    color: z.string().min(1, 'Cor é obrigatória').max(30).trim(),
    plate: z.string().max(10).optional().nullable().or(z.literal('')),
    year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional().nullable(),
    type: vehicleTypeEnum.default('SEDAN'),
  }).optional(),
});

export type PublicBookInput = z.infer<typeof publicBookSchema>;
