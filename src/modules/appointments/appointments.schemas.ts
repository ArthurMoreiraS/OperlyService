import { z } from 'zod';
import { AppointmentStatus } from '@prisma/client';

// Regex para validar formato de hora HH:mm
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

// ===========================================
// CREATE APPOINTMENT
// ===========================================

export const createAppointmentSchema = z.object({
  customerId: z.string().cuid('ID de cliente inválido'),
  serviceId: z.string().cuid('ID de serviço inválido'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data no formato YYYY-MM-DD'),
  startTime: z.string().regex(timeRegex, 'Horário no formato HH:mm'),
  notes: z
    .string()
    .max(500, 'Observações deve ter no máximo 500 caracteres')
    .optional()
    .or(z.literal('')),
  vehicleId: z.string().cuid('ID de veículo inválido').optional(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

// ===========================================
// UPDATE APPOINTMENT
// ===========================================

export const updateAppointmentSchema = z.object({
  customerId: z.string().cuid('ID de cliente inválido').optional(),
  serviceId: z.string().cuid('ID de serviço inválido').optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data no formato YYYY-MM-DD').optional(),
  startTime: z.string().regex(timeRegex, 'Horário no formato HH:mm').optional(),
  notes: z
    .string()
    .max(500, 'Observações deve ter no máximo 500 caracteres')
    .optional()
    .nullable(),
  vehicleId: z.string().cuid('ID de veículo inválido').optional().nullable(),
});

export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;

// ===========================================
// UPDATE STATUS
// ===========================================

export const updateStatusSchema = z.object({
  status: z.nativeEnum(AppointmentStatus, {
    errorMap: () => ({ message: 'Status inválido' }),
  }),
});

export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;

// ===========================================
// APPOINTMENT ID PARAMS
// ===========================================

export const appointmentIdParamsSchema = z.object({
  id: z.string().cuid('ID de agendamento inválido'),
});

export type AppointmentIdParams = z.infer<typeof appointmentIdParamsSchema>;

// ===========================================
// LIST APPOINTMENTS QUERY
// ===========================================

export const listAppointmentsQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data no formato YYYY-MM-DD').optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data no formato YYYY-MM-DD').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data no formato YYYY-MM-DD').optional(),
  status: z.nativeEnum(AppointmentStatus).optional(),
  customerId: z.string().cuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type ListAppointmentsQuery = z.infer<typeof listAppointmentsQuerySchema>;

// ===========================================
// AVAILABLE SLOTS QUERY
// ===========================================

export const availableSlotsQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data no formato YYYY-MM-DD'),
  serviceId: z.string().cuid('ID de serviço inválido').optional(),
  duration: z.coerce.number().int().min(15).max(480).optional(),
});

export type AvailableSlotsQuery = z.infer<typeof availableSlotsQuerySchema>;
