import { z } from 'zod';

// ===========================================
// CREATE SERVICE
// ===========================================

export const createServiceSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),
  description: z
    .string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .trim()
    .nullish(),
  price: z
    .number()
    .min(0, 'Preço não pode ser negativo')
    .max(999999.99, 'Preço excede o limite permitido'),
  duration: z
    .number()
    .int('Duração deve ser um número inteiro')
    .min(15, 'Duração mínima de 15 minutos')
    .max(480, 'Duração máxima de 8 horas')
    .default(60),
  isActive: z
    .boolean()
    .default(true),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;

// ===========================================
// UPDATE SERVICE
// ===========================================

export const updateServiceSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim()
    .optional(),
  description: z
    .string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .trim()
    .nullish(),
  price: z
    .number()
    .min(0, 'Preço não pode ser negativo')
    .max(999999.99, 'Preço excede o limite permitido')
    .optional(),
  duration: z
    .number()
    .int('Duração deve ser um número inteiro')
    .min(15, 'Duração mínima de 15 minutos')
    .max(480, 'Duração máxima de 8 horas')
    .optional(),
  isActive: z
    .boolean()
    .optional(),
});

export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;

// ===========================================
// SERVICE ID PARAMS
// ===========================================

export const serviceIdParamsSchema = z.object({
  id: z.string().cuid('ID de serviço inválido'),
});

export type ServiceIdParams = z.infer<typeof serviceIdParamsSchema>;
