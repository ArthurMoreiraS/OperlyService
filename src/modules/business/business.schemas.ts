import { z } from 'zod';
import { DayOfWeek } from '@prisma/client';

// Regex para validar formato de hora HH:mm
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

// ===========================================
// CREATE BUSINESS (Onboarding)
// ===========================================

export const createBusinessSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),
  phone: z
    .string()
    .min(10, 'Telefone deve ter no mínimo 10 dígitos')
    .max(20, 'Telefone deve ter no máximo 20 caracteres')
    .optional()
    .or(z.literal('')),
  address: z
    .string()
    .max(200, 'Endereço deve ter no máximo 200 caracteres')
    .optional()
    .or(z.literal('')),
  workingDays: z
    .array(z.nativeEnum(DayOfWeek))
    .min(1, 'Selecione ao menos um dia de funcionamento')
    .default(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] as DayOfWeek[]),
  openTime: z
    .string()
    .regex(timeRegex, 'Horário de abertura inválido (HH:mm)')
    .default('08:00'),
  closeTime: z
    .string()
    .regex(timeRegex, 'Horário de fechamento inválido (HH:mm)')
    .default('18:00'),
  slotDuration: z
    .number()
    .int('Duração deve ser um número inteiro')
    .min(15, 'Duração mínima de 15 minutos')
    .max(480, 'Duração máxima de 8 horas')
    .default(60),
}).refine(
  (data) => {
    const openParts = data.openTime.split(':');
    const closeParts = data.closeTime.split(':');
    const openHour = parseInt(openParts[0] || '0', 10);
    const openMin = parseInt(openParts[1] || '0', 10);
    const closeHour = parseInt(closeParts[0] || '0', 10);
    const closeMin = parseInt(closeParts[1] || '0', 10);
    const openMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;
    return closeMinutes > openMinutes;
  },
  {
    message: 'Horário de fechamento deve ser posterior ao de abertura',
    path: ['closeTime'],
  }
);

export type CreateBusinessInput = z.infer<typeof createBusinessSchema>;

// ===========================================
// UPDATE BUSINESS
// ===========================================

export const updateBusinessSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim()
    .optional(),
  phone: z
    .string()
    .min(10, 'Telefone deve ter no mínimo 10 dígitos')
    .max(20, 'Telefone deve ter no máximo 20 caracteres')
    .optional()
    .or(z.literal(''))
    .nullable(),
  address: z
    .string()
    .max(200, 'Endereço deve ter no máximo 200 caracteres')
    .optional()
    .or(z.literal(''))
    .nullable(),
  imageUrl: z
    .string()
    .url('URL de imagem inválida')
    .optional()
    .or(z.literal(''))
    .nullable(),
  monthlyRevenueGoal: z
    .number()
    .min(0, 'Meta deve ser um valor positivo')
    .max(9999999.99, 'Meta excede o limite permitido')
    .optional()
    .nullable(),
  workingDays: z
    .array(z.nativeEnum(DayOfWeek))
    .min(1, 'Selecione ao menos um dia de funcionamento')
    .optional(),
  openTime: z
    .string()
    .regex(timeRegex, 'Horário de abertura inválido (HH:mm)')
    .optional(),
  closeTime: z
    .string()
    .regex(timeRegex, 'Horário de fechamento inválido (HH:mm)')
    .optional(),
  slotDuration: z
    .number()
    .int('Duração deve ser um número inteiro')
    .min(15, 'Duração mínima de 15 minutos')
    .max(480, 'Duração máxima de 8 horas')
    .optional(),
});

export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>;

// ===========================================
// SLUG PARAMS
// ===========================================

export const slugParamsSchema = z.object({
  slug: z
    .string()
    .min(3, 'Slug deve ter no mínimo 3 caracteres')
    .max(50, 'Slug deve ter no máximo 50 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
});

export type SlugParams = z.infer<typeof slugParamsSchema>;
