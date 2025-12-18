import { Router } from 'express';
import { billingController } from './billing.controller';
import { authMiddleware, validate, validateBody, requireOnboarding } from '../../shared/middlewares';
import {
  createInvoiceSchema,
  createInvoiceFromAppointmentSchema,
  updateInvoiceSchema,
  issueInvoiceSchema,
  addPaymentSchema,
  listInvoicesQuerySchema,
  billingStatsQuerySchema,
} from './billing.schemas';

const router = Router();

// Todas as rotas requerem autenticação e vínculo com business
router.use(authMiddleware, requireOnboarding);

// =====================
// FATURAS
// =====================

/**
 * POST /billing/invoices
 * Cria uma fatura manual
 */
router.post(
  '/invoices',
  validate(createInvoiceSchema),
  billingController.createInvoice
);

/**
 * POST /billing/invoices/from-appointment
 * Cria uma fatura a partir de um agendamento completado
 */
router.post(
  '/invoices/from-appointment',
  validate(createInvoiceFromAppointmentSchema),
  billingController.createFromAppointment
);

/**
 * GET /billing/invoices
 * Lista faturas com filtros e paginação
 */
router.get(
  '/invoices',
  validate(listInvoicesQuerySchema, 'query'),
  billingController.listInvoices
);

/**
 * GET /billing/invoices/:id
 * Busca uma fatura específica
 */
router.get(
  '/invoices/:id',
  billingController.getInvoice
);

/**
 * PATCH /billing/invoices/:id
 * Atualiza uma fatura (apenas rascunhos)
 */
router.patch(
  '/invoices/:id',
  validate(updateInvoiceSchema),
  billingController.updateInvoice
);

/**
 * POST /billing/invoices/:id/issue
 * Emite uma fatura (transição DRAFT -> PENDING)
 */
router.post(
  '/invoices/:id/issue',
  validate(issueInvoiceSchema),
  billingController.issueInvoice
);

/**
 * POST /billing/invoices/:id/cancel
 * Cancela uma fatura
 */
router.post(
  '/invoices/:id/cancel',
  billingController.cancelInvoice
);

// =====================
// PAGAMENTOS
// =====================

/**
 * POST /billing/invoices/:id/payments
 * Adiciona um pagamento a uma fatura
 */
router.post(
  '/invoices/:id/payments',
  validate(addPaymentSchema),
  billingController.addPayment
);

/**
 * DELETE /billing/invoices/:id/payments/:paymentId
 * Remove um pagamento de uma fatura
 */
router.delete(
  '/invoices/:id/payments/:paymentId',
  billingController.removePayment
);

// =====================
// ESTATÍSTICAS
// =====================

/**
 * GET /billing/stats
 * Retorna estatísticas de faturamento
 */
router.get(
  '/stats',
  validate(billingStatsQuerySchema, 'query'),
  billingController.getStats
);

export { router as billingRoutes };
