import { prisma } from '../../config';
import { ApiError } from '../../shared/utils';
import {
  CreateInvoiceInput,
  CreateInvoiceFromAppointmentInput,
  UpdateInvoiceInput,
  IssueInvoiceInput,
  AddPaymentInput,
  ListInvoicesQuery,
  BillingStatsQuery,
} from './billing.schemas';
import { InvoiceStatus, PaymentMethod, Prisma } from '@prisma/client';

// ===========================================
// TYPES
// ===========================================

interface InvoiceWithRelations {
  id: string;
  number: string;
  status: InvoiceStatus;
  subtotal: Prisma.Decimal;
  discount: Prisma.Decimal;
  total: Prisma.Decimal;
  paidAmount: Prisma.Decimal;
  issuedAt: Date | null;
  dueDate: Date | null;
  paidAt: Date | null;
  notes: string | null;
  createdAt: Date;
  customer: {
    id: string;
    name: string;
    phone: string;
  };
  appointment: {
    id: string;
    date: Date;
    startTime: string;
  } | null;
  items: {
    id: string;
    description: string;
    quantity: number;
    unitPrice: Prisma.Decimal;
    total: Prisma.Decimal;
    service: { id: string; name: string } | null;
  }[];
  payments: {
    id: string;
    amount: Prisma.Decimal;
    method: PaymentMethod;
    paidAt: Date;
    notes: string | null;
  }[];
}

interface BillingStats {
  totalRevenue: number;
  totalPending: number;
  totalOverdue: number;
  invoiceCount: {
    total: number;
    paid: number;
    pending: number;
    overdue: number;
  };
  revenueByMethod: {
    method: PaymentMethod;
    total: number;
    count: number;
  }[];
  revenueByDay: {
    date: string;
    revenue: number;
    count: number;
  }[];
}

// ===========================================
// SERVICE
// ===========================================

export class BillingService {
  /**
   * Gera o próximo número de fatura para o business
   */
  private async getNextInvoiceNumber(businessId: string): Promise<string> {
    const lastInvoice = await prisma.invoice.findFirst({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      select: { number: true },
    });

    if (!lastInvoice) {
      return 'NF-0001';
    }

    const lastNumber = parseInt(lastInvoice.number.replace('NF-', ''), 10);
    const nextNumber = (lastNumber + 1).toString().padStart(4, '0');
    return `NF-${nextNumber}`;
  }

  /**
   * Atualiza o status da fatura baseado nos pagamentos
   */
  private async updateInvoiceStatus(invoiceId: string): Promise<void> {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true },
    });

    if (!invoice) return;

    const totalPaid = invoice.payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );

    let newStatus: InvoiceStatus = invoice.status;
    const total = Number(invoice.total);

    if (totalPaid >= total) {
      newStatus = 'PAID';
    } else if (totalPaid > 0) {
      newStatus = 'PARTIAL';
    } else if (invoice.dueDate && new Date(invoice.dueDate) < new Date() && invoice.status === 'PENDING') {
      newStatus = 'OVERDUE';
    }

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: totalPaid,
        status: newStatus,
        paidAt: newStatus === 'PAID' ? new Date() : null,
      },
    });
  }

  /**
   * Cria uma fatura a partir de um agendamento concluído
   */
  async createFromAppointment(
    businessId: string,
    data: CreateInvoiceFromAppointmentInput
  ): Promise<InvoiceWithRelations> {
    // Busca o agendamento
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: data.appointmentId,
        businessId,
      },
      include: {
        customer: true,
        service: true,
      },
    });

    if (!appointment) {
      throw ApiError.notFound('Agendamento não encontrado');
    }

    // Verifica se já existe fatura para este agendamento
    const existingInvoice = await prisma.invoice.findFirst({
      where: { appointmentId: data.appointmentId },
    });

    if (existingInvoice) {
      throw ApiError.badRequest('Já existe uma fatura para este agendamento');
    }

    const number = await this.getNextInvoiceNumber(businessId);
    const servicePrice = Number(appointment.service.price);
    const discount = data.discount || 0;
    const total = servicePrice - discount;

    const invoice = await prisma.invoice.create({
      data: {
        businessId,
        customerId: appointment.customerId,
        appointmentId: appointment.id,
        number,
        status: data.autoIssue ? 'PENDING' : 'DRAFT',
        issuedAt: data.autoIssue ? new Date() : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        subtotal: servicePrice,
        discount,
        total,
        notes: data.notes,
        items: {
          create: {
            serviceId: appointment.serviceId,
            description: appointment.service.name,
            quantity: 1,
            unitPrice: servicePrice,
            total: servicePrice,
          },
        },
      },
      include: this.getInvoiceIncludes(),
    });

    return invoice as InvoiceWithRelations;
  }

  /**
   * Cria uma fatura manual
   */
  async create(
    businessId: string,
    data: CreateInvoiceInput
  ): Promise<InvoiceWithRelations> {
    // Verifica se o cliente existe
    const customer = await prisma.customer.findFirst({
      where: { id: data.customerId, businessId },
    });

    if (!customer) {
      throw ApiError.notFound('Cliente não encontrado');
    }

    // Se tem appointmentId, verifica se já não existe fatura
    if (data.appointmentId) {
      const existingInvoice = await prisma.invoice.findFirst({
        where: { appointmentId: data.appointmentId },
      });

      if (existingInvoice) {
        throw ApiError.badRequest('Já existe uma fatura para este agendamento');
      }
    }

    const number = await this.getNextInvoiceNumber(businessId);

    // Calcula totais dos itens
    const itemsData = data.items.map((item) => ({
      serviceId: item.serviceId || null,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.quantity * item.unitPrice,
    }));

    const subtotal = itemsData.reduce((sum, item) => sum + item.total, 0);
    const discount = data.discount || 0;
    const total = subtotal - discount;

    const invoice = await prisma.invoice.create({
      data: {
        businessId,
        customerId: data.customerId,
        appointmentId: data.appointmentId || null,
        number,
        status: data.autoIssue ? 'PENDING' : 'DRAFT',
        issuedAt: data.autoIssue ? new Date() : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        subtotal,
        discount,
        total,
        notes: data.notes,
        items: {
          create: itemsData,
        },
      },
      include: this.getInvoiceIncludes(),
    });

    return invoice as InvoiceWithRelations;
  }

  /**
   * Lista faturas com filtros
   */
  async list(
    businessId: string,
    query: ListInvoicesQuery
  ): Promise<{ data: InvoiceWithRelations[]; pagination: any }> {
    const { page, limit, status, customerId, startDate, endDate, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.InvoiceWhereInput = {
      businessId,
      ...(status && { status }),
      ...(customerId && { customerId }),
      ...(startDate && {
        issuedAt: {
          gte: new Date(startDate),
          ...(endDate && { lte: new Date(endDate) }),
        },
      }),
      ...(search && {
        OR: [
          { number: { contains: search, mode: 'insensitive' } },
          { customer: { name: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: this.getInvoiceIncludes(),
      }),
      prisma.invoice.count({ where }),
    ]);

    return {
      data: invoices as InvoiceWithRelations[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Busca uma fatura por ID
   */
  async getById(
    businessId: string,
    invoiceId: string
  ): Promise<InvoiceWithRelations> {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, businessId },
      include: this.getInvoiceIncludes(),
    });

    if (!invoice) {
      throw ApiError.notFound('Fatura não encontrada');
    }

    return invoice as InvoiceWithRelations;
  }

  /**
   * Atualiza uma fatura (apenas DRAFT)
   */
  async update(
    businessId: string,
    invoiceId: string,
    data: UpdateInvoiceInput
  ): Promise<InvoiceWithRelations> {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, businessId },
    });

    if (!invoice) {
      throw ApiError.notFound('Fatura não encontrada');
    }

    if (invoice.status !== 'DRAFT') {
      throw ApiError.badRequest('Apenas faturas em rascunho podem ser editadas');
    }

    const total = Number(invoice.subtotal) - (data.discount ?? Number(invoice.discount));

    const updated = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        ...(data.discount !== undefined && { discount: data.discount, total }),
        ...(data.dueDate && { dueDate: new Date(data.dueDate) }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
      include: this.getInvoiceIncludes(),
    });

    return updated as InvoiceWithRelations;
  }

  /**
   * Emite uma fatura (DRAFT -> PENDING)
   */
  async issue(
    businessId: string,
    invoiceId: string,
    data: IssueInvoiceInput
  ): Promise<InvoiceWithRelations> {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, businessId },
    });

    if (!invoice) {
      throw ApiError.notFound('Fatura não encontrada');
    }

    if (invoice.status !== 'DRAFT') {
      throw ApiError.badRequest('Apenas faturas em rascunho podem ser emitidas');
    }

    const updated = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'PENDING',
        issuedAt: new Date(),
        ...(data.dueDate && { dueDate: new Date(data.dueDate) }),
      },
      include: this.getInvoiceIncludes(),
    });

    return updated as InvoiceWithRelations;
  }

  /**
   * Cancela uma fatura
   */
  async cancel(
    businessId: string,
    invoiceId: string
  ): Promise<InvoiceWithRelations> {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, businessId },
    });

    if (!invoice) {
      throw ApiError.notFound('Fatura não encontrada');
    }

    if (invoice.status === 'PAID') {
      throw ApiError.badRequest('Faturas pagas não podem ser canceladas');
    }

    if (invoice.status === 'CANCELLED') {
      throw ApiError.badRequest('Fatura já está cancelada');
    }

    const updated = await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'CANCELLED' },
      include: this.getInvoiceIncludes(),
    });

    return updated as InvoiceWithRelations;
  }

  /**
   * Adiciona um pagamento à fatura
   */
  async addPayment(
    businessId: string,
    invoiceId: string,
    data: AddPaymentInput
  ): Promise<InvoiceWithRelations> {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, businessId },
    });

    if (!invoice) {
      throw ApiError.notFound('Fatura não encontrada');
    }

    if (invoice.status === 'CANCELLED') {
      throw ApiError.badRequest('Não é possível adicionar pagamento a uma fatura cancelada');
    }

    if (invoice.status === 'DRAFT') {
      throw ApiError.badRequest('Emita a fatura antes de adicionar pagamentos');
    }

    if (invoice.status === 'PAID') {
      throw ApiError.badRequest('Fatura já está totalmente paga');
    }

    const remaining = Number(invoice.total) - Number(invoice.paidAmount);
    if (data.amount > remaining) {
      throw ApiError.badRequest(`Valor excede o saldo restante de R$ ${remaining.toFixed(2)}`);
    }

    await prisma.payment.create({
      data: {
        invoiceId,
        amount: data.amount,
        method: data.method,
        paidAt: data.paidAt ? new Date(data.paidAt) : new Date(),
        notes: data.notes,
      },
    });

    await this.updateInvoiceStatus(invoiceId);

    return this.getById(businessId, invoiceId);
  }

  /**
   * Remove um pagamento
   */
  async removePayment(
    businessId: string,
    invoiceId: string,
    paymentId: string
  ): Promise<InvoiceWithRelations> {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, businessId },
      include: { payments: true },
    });

    if (!invoice) {
      throw ApiError.notFound('Fatura não encontrada');
    }

    const payment = invoice.payments.find((p) => p.id === paymentId);
    if (!payment) {
      throw ApiError.notFound('Pagamento não encontrado');
    }

    await prisma.payment.delete({ where: { id: paymentId } });
    await this.updateInvoiceStatus(invoiceId);

    return this.getById(businessId, invoiceId);
  }

  /**
   * Estatísticas de faturamento
   */
  async getStats(businessId: string, query: BillingStatsQuery): Promise<BillingStats> {
    const now = new Date();
    let startDate: Date;
    let endDate = new Date();

    if (query.startDate && query.endDate) {
      startDate = new Date(query.startDate);
      endDate = new Date(query.endDate);
    } else {
      switch (query.period) {
        case 'week':
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        case 'month':
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }
    }

    // Total de receita (faturas pagas)
    const paidInvoices = await prisma.invoice.findMany({
      where: {
        businessId,
        status: 'PAID',
        paidAt: { gte: startDate, lte: endDate },
      },
      select: { total: true },
    });

    const totalRevenue = paidInvoices.reduce(
      (sum, inv) => sum + Number(inv.total),
      0
    );

    // Total pendente
    const pendingInvoices = await prisma.invoice.findMany({
      where: {
        businessId,
        status: { in: ['PENDING', 'PARTIAL'] },
      },
      select: { total: true, paidAmount: true },
    });

    const totalPending = pendingInvoices.reduce(
      (sum, inv) => sum + (Number(inv.total) - Number(inv.paidAmount)),
      0
    );

    // Total vencido
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        businessId,
        status: 'OVERDUE',
      },
      select: { total: true, paidAmount: true },
    });

    const totalOverdue = overdueInvoices.reduce(
      (sum, inv) => sum + (Number(inv.total) - Number(inv.paidAmount)),
      0
    );

    // Contagem por status
    const invoiceCounts = await prisma.invoice.groupBy({
      by: ['status'],
      where: { businessId },
      _count: true,
    });

    const invoiceCount = {
      total: invoiceCounts.reduce((sum, c) => sum + c._count, 0),
      paid: invoiceCounts.find((c) => c.status === 'PAID')?._count || 0,
      pending: invoiceCounts.find((c) => c.status === 'PENDING')?._count || 0,
      overdue: invoiceCounts.find((c) => c.status === 'OVERDUE')?._count || 0,
    };

    // Receita por método de pagamento
    const paymentsByMethod = await prisma.payment.groupBy({
      by: ['method'],
      where: {
        invoice: { businessId },
        paidAt: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
      _count: true,
    });

    const revenueByMethod = paymentsByMethod.map((p) => ({
      method: p.method,
      total: Number(p._sum.amount) || 0,
      count: p._count,
    }));

    // Receita por dia (últimos 30 dias)
    const payments = await prisma.payment.findMany({
      where: {
        invoice: { businessId },
        paidAt: { gte: startDate, lte: endDate },
      },
      select: {
        amount: true,
        paidAt: true,
      },
      orderBy: { paidAt: 'asc' },
    });

    const revenueByDayMap = new Map<string, { revenue: number; count: number }>();
    payments.forEach((p) => {
      const dateKey = p.paidAt.toISOString().split('T')[0] as string;
      const existing = revenueByDayMap.get(dateKey) || { revenue: 0, count: 0 };
      revenueByDayMap.set(dateKey, {
        revenue: existing.revenue + Number(p.amount),
        count: existing.count + 1,
      });
    });

    const revenueByDay = Array.from(revenueByDayMap.entries()).map(([date, data]) => ({
      date,
      revenue: data.revenue,
      count: data.count,
    }));

    return {
      totalRevenue,
      totalPending,
      totalOverdue,
      invoiceCount,
      revenueByMethod,
      revenueByDay,
    };
  }

  /**
   * Helper: includes padrão para invoice
   */
  private getInvoiceIncludes() {
    return {
      customer: {
        select: { id: true, name: true, phone: true },
      },
      appointment: {
        select: { id: true, date: true, startTime: true },
      },
      items: {
        select: {
          id: true,
          description: true,
          quantity: true,
          unitPrice: true,
          total: true,
          service: { select: { id: true, name: true } },
        },
      },
      payments: {
        select: {
          id: true,
          amount: true,
          method: true,
          paidAt: true,
          notes: true,
        },
        orderBy: { paidAt: 'desc' as const },
      },
    };
  }
}

export const billingService = new BillingService();
