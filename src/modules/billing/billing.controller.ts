import { Request, Response, NextFunction } from 'express';
import { billingService } from './billing.service';
import { ApiResponseHelper } from '../../shared/utils';
import {
  CreateInvoiceInput,
  CreateInvoiceFromAppointmentInput,
  UpdateInvoiceInput,
  IssueInvoiceInput,
  AddPaymentInput,
  ListInvoicesQuery,
  BillingStatsQuery,
} from './billing.schemas';

export class BillingController {
  /**
   * POST /billing/invoices
   * Cria uma fatura manual
   */
  async createInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId!;
      const data = req.body as CreateInvoiceInput;

      const invoice = await billingService.create(businessId, data);

      res.status(201).json(
        ApiResponseHelper.success(invoice, 'Fatura criada com sucesso')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /billing/invoices/from-appointment
   * Cria uma fatura a partir de um agendamento
   */
  async createFromAppointment(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId!;
      const data = req.body as CreateInvoiceFromAppointmentInput;

      const invoice = await billingService.createFromAppointment(businessId, data);

      res.status(201).json(
        ApiResponseHelper.success(invoice, 'Fatura criada a partir do agendamento')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /billing/invoices
   * Lista faturas com filtros
   */
  async listInvoices(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId!;
      const query = req.query as unknown as ListInvoicesQuery;

      const result = await billingService.list(businessId, query);

      res.json(ApiResponseHelper.success(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /billing/invoices/:id
   * Busca uma fatura por ID
   */
  async getInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId!;
      const id = req.params.id as string;

      const invoice = await billingService.getById(businessId, id);

      res.json(ApiResponseHelper.success(invoice));
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /billing/invoices/:id
   * Atualiza uma fatura (apenas DRAFT)
   */
  async updateInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId!;
      const id = req.params.id as string;
      const data = req.body as UpdateInvoiceInput;

      const invoice = await billingService.update(businessId, id, data);

      res.json(ApiResponseHelper.success(invoice, 'Fatura atualizada'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /billing/invoices/:id/issue
   * Emite uma fatura (DRAFT -> PENDING)
   */
  async issueInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId!;
      const id = req.params.id as string;
      const data = req.body as IssueInvoiceInput;

      const invoice = await billingService.issue(businessId, id, data);

      res.json(ApiResponseHelper.success(invoice, 'Fatura emitida com sucesso'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /billing/invoices/:id/cancel
   * Cancela uma fatura
   */
  async cancelInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId!;
      const id = req.params.id as string;

      const invoice = await billingService.cancel(businessId, id);

      res.json(ApiResponseHelper.success(invoice, 'Fatura cancelada'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /billing/invoices/:id/payments
   * Adiciona um pagamento
   */
  async addPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId!;
      const id = req.params.id as string;
      const data = req.body as AddPaymentInput;

      const invoice = await billingService.addPayment(businessId, id, data);

      res.json(ApiResponseHelper.success(invoice, 'Pagamento registrado'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /billing/invoices/:id/payments/:paymentId
   * Remove um pagamento
   */
  async removePayment(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId!;
      const id = req.params.id as string;
      const paymentId = req.params.paymentId as string;

      const invoice = await billingService.removePayment(businessId, id, paymentId);

      res.json(ApiResponseHelper.success(invoice, 'Pagamento removido'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /billing/stats
   * Estatísticas de faturamento
   */
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.user!.businessId!;
      const query = req.query as unknown as BillingStatsQuery;

      const stats = await billingService.getStats(businessId, query);

      res.json(ApiResponseHelper.success(stats));
    } catch (error) {
      next(error);
    }
  }
}

export const billingController = new BillingController();
