import { z } from 'zod';

// ===========================================
// ENUMS
// ===========================================

export const InvoiceStatusEnum = z.enum([
  'DRAFT',
  'PENDING',
  'PARTIAL',
  'PAID',
  'CANCELLED',
  'OVERDUE',
]);

export const PaymentMethodEnum = z.enum([
  'PIX',
  'CREDIT_CARD',
  'DEBIT_CARD',
  'CASH',
  'TRANSFER',
  'OTHER',
]);

// ===========================================
// INVOICE ITEM SCHEMAS
// ===========================================

export const invoiceItemSchema = z.object({
  serviceId: z.string().optional(),
  description: z.string().min(1, 'Descrição é obrigatória'),
  quantity: z.number().int().positive().default(1),
  unitPrice: z.number().positive('Preço deve ser positivo'),
});

// ===========================================
// CREATE INVOICE
// ===========================================

export const createInvoiceSchema = z.object({
  customerId: z.string().min(1, 'Cliente é obrigatório'),
  appointmentId: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, 'Pelo menos um item é obrigatório'),
  discount: z.number().min(0).default(0),
  dueDate: z.string().optional(), // ISO date string
  notes: z.string().optional(),
  autoIssue: z.boolean().default(false), // Se true, já emite a fatura
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

// ===========================================
// CREATE INVOICE FROM APPOINTMENT
// ===========================================

export const createInvoiceFromAppointmentSchema = z.object({
  appointmentId: z.string().min(1, 'Agendamento é obrigatório'),
  discount: z.number().min(0).default(0),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  autoIssue: z.boolean().default(true),
});

export type CreateInvoiceFromAppointmentInput = z.infer<typeof createInvoiceFromAppointmentSchema>;

// ===========================================
// UPDATE INVOICE
// ===========================================

export const updateInvoiceSchema = z.object({
  discount: z.number().min(0).optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});

export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;

// ===========================================
// ISSUE INVOICE (Emitir)
// ===========================================

export const issueInvoiceSchema = z.object({
  dueDate: z.string().optional(),
});

export type IssueInvoiceInput = z.infer<typeof issueInvoiceSchema>;

// ===========================================
// ADD PAYMENT
// ===========================================

export const addPaymentSchema = z.object({
  amount: z.number().positive('Valor deve ser positivo'),
  method: PaymentMethodEnum,
  paidAt: z.string().optional(), // ISO datetime string
  notes: z.string().optional(),
});

export type AddPaymentInput = z.infer<typeof addPaymentSchema>;

// ===========================================
// LIST INVOICES QUERY
// ===========================================

export const listInvoicesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: InvoiceStatusEnum.optional(),
  customerId: z.string().optional(),
  startDate: z.string().optional(), // Filter by issuedAt
  endDate: z.string().optional(),
  search: z.string().optional(), // Search by number or customer name
});

export type ListInvoicesQuery = z.infer<typeof listInvoicesQuerySchema>;

// ===========================================
// BILLING STATS QUERY
// ===========================================

export const billingStatsQuerySchema = z.object({
  period: z.enum(['week', 'month', 'year']).default('month'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type BillingStatsQuery = z.infer<typeof billingStatsQuerySchema>;
