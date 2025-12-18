import { prisma } from '../../config';
import { ApiError, DateUtils } from '../../shared/utils';
import {
  CreateAppointmentInput,
  UpdateAppointmentInput,
  ListAppointmentsQuery,
  AvailableSlotsQuery
} from './appointments.schemas';
import { Appointment, AppointmentStatus, DayOfWeek, VehicleType } from '@prisma/client';

interface CustomerSelect {
  id: string;
  name: string;
  phone: string;
}

interface ServiceSelect {
  id: string;
  name: string;
  price: unknown;
  duration: number;
}

interface VehicleSelect {
  id: string;
  brand: string;
  model: string;
  color: string;
  plate: string | null;
  year: number | null;
  type: VehicleType;
}

export interface AppointmentWithRelations {
  id: string;
  businessId: string;
  customerId: string;
  serviceId: string;
  vehicleId: string | null;
  date: Date;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  isFromPublic: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  customer: CustomerSelect;
  service: ServiceSelect;
  vehicle: VehicleSelect | null;
}

interface PaginatedAppointments {
  data: AppointmentWithRelations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export class AppointmentsService {
  /**
   * Cria um novo agendamento
   */
  async create(businessId: string, data: CreateAppointmentInput, isFromPublic = false): Promise<Appointment> {
    // Busca o serviço para obter a duração
    const service = await prisma.service.findFirst({
      where: { id: data.serviceId, businessId, isActive: true },
    });

    if (!service) {
      throw ApiError.notFound('Serviço não encontrado ou inativo');
    }

    // Verifica se o cliente pertence ao business
    const customer = await prisma.customer.findFirst({
      where: { id: data.customerId, businessId },
    });

    if (!customer) {
      throw ApiError.notFound('Cliente não encontrado');
    }

    // Calcula horário de término
    const endTime = DateUtils.addMinutesToTime(data.startTime, service.duration);

    // Valida se está dentro do horário de funcionamento
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw ApiError.notFound('Estabelecimento não encontrado');
    }

    // Verifica se o dia está nos dias de funcionamento
    const dateObj = new Date(data.date + 'T12:00:00'); // Meio-dia para evitar problemas de timezone
    const dayOfWeek = this.getDayOfWeek(dateObj);

    if (!business.workingDays.includes(dayOfWeek)) {
      throw ApiError.badRequest('O estabelecimento não funciona neste dia');
    }

    // Verifica horário de funcionamento
    if (data.startTime < business.openTime || endTime > business.closeTime) {
      throw ApiError.badRequest(
        `Horário fora do funcionamento (${business.openTime} - ${business.closeTime})`
      );
    }

    // Verifica conflitos de horário
    const hasConflict = await this.checkTimeConflict(
      businessId,
      data.date,
      data.startTime,
      endTime
    );

    if (hasConflict) {
      throw ApiError.conflict('Já existe um agendamento neste horário');
    }

    // Cria o agendamento
    const appointment = await prisma.appointment.create({
      data: {
        businessId,
        customerId: data.customerId,
        serviceId: data.serviceId,
        vehicleId: data.vehicleId || null,
        date: new Date(data.date),
        startTime: data.startTime,
        endTime,
        notes: data.notes || null,
        isFromPublic,
        status: 'PENDING',
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        service: { select: { id: true, name: true, price: true, duration: true } },
        vehicle: { select: { id: true, brand: true, model: true, color: true, plate: true, year: true, type: true } },
      },
    });

    return appointment;
  }

  /**
   * Lista agendamentos com filtros e paginação
   */
  async list(businessId: string, query: ListAppointmentsQuery): Promise<PaginatedAppointments> {
    const { date, startDate, endDate, status, customerId, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    // Constrói filtro de data (usando UTC para evitar problemas de timezone)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { businessId };

    if (date) {
      // Converte para UTC mantendo a data local
      where.date = new Date(date + 'T00:00:00.000Z');
    } else if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate + 'T00:00:00.000Z');
      if (endDate) where.date.lte = new Date(endDate + 'T00:00:00.000Z');
    }

    if (status) where.status = status;
    if (customerId) where.customerId = customerId;

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          service: { select: { id: true, name: true, price: true, duration: true } },
          vehicle: { select: { id: true, brand: true, model: true, color: true, plate: true, year: true, type: true } },
        },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.appointment.count({ where }),
    ]);

    return {
      data: appointments as AppointmentWithRelations[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Busca agendamento por ID
   */
  async getById(appointmentId: string, businessId: string): Promise<AppointmentWithRelations> {
    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, businessId },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        service: { select: { id: true, name: true, price: true, duration: true } },
        vehicle: { select: { id: true, brand: true, model: true, color: true, plate: true, year: true, type: true } },
      },
    });

    if (!appointment) {
      throw ApiError.notFound('Agendamento não encontrado');
    }

    return appointment as AppointmentWithRelations;
  }

  /**
   * Atualiza um agendamento
   */
  async update(appointmentId: string, businessId: string, data: UpdateAppointmentInput): Promise<Appointment> {
    const existingAppointment = await this.getById(appointmentId, businessId);

    // Não permite alterar agendamentos concluídos ou cancelados
    if (['COMPLETED', 'CANCELLED'].includes(existingAppointment.status)) {
      throw ApiError.badRequest('Não é possível alterar agendamento concluído ou cancelado');
    }

    let endTime = existingAppointment.endTime;

    // Se mudou serviço ou horário, recalcula
    if (data.serviceId || data.startTime) {
      const serviceId = data.serviceId || existingAppointment.serviceId;
      const service = await prisma.service.findFirst({
        where: { id: serviceId, businessId, isActive: true },
      });

      if (!service) {
        throw ApiError.notFound('Serviço não encontrado ou inativo');
      }

      const startTime = data.startTime || existingAppointment.startTime;
      endTime = DateUtils.addMinutesToTime(startTime, service.duration);
    }

    // Se mudou data ou horário, verifica conflitos
    if (data.date || data.startTime) {
      const date = data.date || DateUtils.formatDate(existingAppointment.date);
      const startTime = data.startTime || existingAppointment.startTime;

      const hasConflict = await this.checkTimeConflict(
        businessId,
        date,
        startTime,
        endTime,
        appointmentId // Exclui o próprio agendamento
      );

      if (hasConflict) {
        throw ApiError.conflict('Já existe um agendamento neste horário');
      }
    }

    // Valida cliente
    if (data.customerId) {
      const customer = await prisma.customer.findFirst({
        where: { id: data.customerId, businessId },
      });

      if (!customer) {
        throw ApiError.notFound('Cliente não encontrado');
      }
    }

    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        customerId: data.customerId,
        serviceId: data.serviceId,
        vehicleId: data.vehicleId,
        date: data.date ? new Date(data.date) : undefined,
        startTime: data.startTime,
        endTime,
        notes: data.notes,
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        service: { select: { id: true, name: true, price: true, duration: true } },
        vehicle: { select: { id: true, brand: true, model: true, color: true, plate: true, year: true, type: true } },
      },
    });

    return appointment;
  }

  /**
   * Atualiza status do agendamento
   */
  async updateStatus(appointmentId: string, businessId: string, status: AppointmentStatus): Promise<Appointment> {
    const existingAppointment = await this.getById(appointmentId, businessId);

    // Validações de transição de status
    if (existingAppointment.status === 'CANCELLED') {
      throw ApiError.badRequest('Não é possível alterar agendamento cancelado');
    }

    if (existingAppointment.status === 'COMPLETED' && status !== 'COMPLETED') {
      throw ApiError.badRequest('Não é possível reverter agendamento concluído');
    }

    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        service: { select: { id: true, name: true, price: true, duration: true } },
        vehicle: { select: { id: true, brand: true, model: true, color: true, plate: true, year: true, type: true } },
      },
    });

    return appointment;
  }

  /**
   * Deleta um agendamento
   */
  async delete(appointmentId: string, businessId: string): Promise<void> {
    await this.getById(appointmentId, businessId);

    await prisma.appointment.delete({
      where: { id: appointmentId },
    });
  }

  /**
   * Retorna slots disponíveis para uma data
   */
  async getAvailableSlots(businessId: string, query: AvailableSlotsQuery): Promise<TimeSlot[]> {
    const { date, serviceId, duration: customDuration } = query;

    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw ApiError.notFound('Estabelecimento não encontrado');
    }

    // Determina a duração a considerar
    let duration = business.slotDuration;

    if (serviceId) {
      const service = await prisma.service.findFirst({
        where: { id: serviceId, businessId, isActive: true },
      });
      if (service) {
        duration = service.duration;
      }
    } else if (customDuration) {
      duration = customDuration;
    }

    // Verifica se o dia está nos dias de funcionamento
    const dateObj = new Date(date + 'T12:00:00');
    const dayOfWeek = this.getDayOfWeek(dateObj);

    if (!business.workingDays.includes(dayOfWeek)) {
      return []; // Dia não funciona
    }

    // Gera todos os slots possíveis
    const allSlots = DateUtils.generateTimeSlots(
      business.openTime,
      business.closeTime,
      duration
    );

    // Busca agendamentos existentes na data
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        businessId,
        date: new Date(date),
        status: { notIn: ['CANCELLED'] },
      },
      select: { startTime: true, endTime: true },
    });

    // Marca slots indisponíveis
    const slots: TimeSlot[] = allSlots.map(time => {
      const slotEnd = DateUtils.addMinutesToTime(time, duration);

      const hasConflict = existingAppointments.some((apt: { startTime: string; endTime: string }) =>
        DateUtils.timeRangesOverlap(time, slotEnd, apt.startTime, apt.endTime)
      );

      // Verifica se é horário passado (se for hoje)
      const today = DateUtils.formatDate(new Date());
      let isPast = false;
      if (date === today) {
        const now = DateUtils.formatTime(new Date());
        isPast = time < now;
      }

      return {
        time,
        available: !hasConflict && !isPast,
      };
    });

    return slots;
  }

  /**
   * Verifica se há conflito de horário
   */
  private async checkTimeConflict(
    businessId: string,
    date: string,
    startTime: string,
    endTime: string,
    excludeAppointmentId?: string
  ): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      businessId,
      date: new Date(date),
      status: { notIn: ['CANCELLED'] },
    };

    if (excludeAppointmentId) {
      where.NOT = { id: excludeAppointmentId };
    }

    const appointments = await prisma.appointment.findMany({
      where,
      select: { startTime: true, endTime: true },
    });

    return appointments.some((apt: { startTime: string; endTime: string }) =>
      DateUtils.timeRangesOverlap(startTime, endTime, apt.startTime, apt.endTime)
    );
  }

  /**
  /**
   * Converte Date para DayOfWeek enum
   */
  private getDayOfWeek(date: Date): DayOfWeek {
    const days: DayOfWeek[] = [
      'SUNDAY',
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ];
    return days[date.getDay()] || 'SUNDAY';
  }
}

export const appointmentsService = new AppointmentsService();
