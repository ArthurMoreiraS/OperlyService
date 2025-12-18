import { prisma } from '../../config';
import { ApiError } from '../../shared/utils';
import { customersService } from '../customers';
import { appointmentsService, TimeSlot } from '../appointments';
import { PublicSlotsQuery, PublicBookInput } from './public.schemas';

export class PublicService {
  /**
   * Busca estabelecimento por slug (dados públicos)
   */
  async getBusinessBySlug(slug: string) {
    const business = await prisma.business.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        phone: true,
        address: true,
        slug: true,
        imageUrl: true,
        workingDays: true,
        openTime: true,
        closeTime: true,
        slotDuration: true,
      },
    });

    if (!business) {
      throw ApiError.notFound('Estabelecimento não encontrado');
    }

    return business;
  }

  /**
   * Lista serviços ativos do estabelecimento
   */
  async getServices(slug: string) {
    const business = await this.getBusinessBySlug(slug);

    const services = await prisma.service.findMany({
      where: {
        businessId: business.id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        price: true,
        duration: true,
      },
      orderBy: { name: 'asc' },
    });

    // Converte Decimal para number para serialização correta
    return services.map(service => ({
      ...service,
      price: Number(service.price),
    }));
  }

  /**
   * Retorna slots disponíveis
   */
  async getAvailableSlots(slug: string, query: PublicSlotsQuery): Promise<TimeSlot[]> {
    const business = await this.getBusinessBySlug(slug);
    return appointmentsService.getAvailableSlots(business.id, query);
  }

  /**
   * Realiza agendamento público
   */
  async bookAppointment(slug: string, data: PublicBookInput) {
    const business = await this.getBusinessBySlug(slug);

    // Busca ou cria o cliente com veículo se fornecido
    const { customer, vehicle } = await customersService.findOrCreateWithVehicle(
      business.id,
      data.customerName,
      data.customerPhone,
      data.vehicle ? {
        brand: data.vehicle.brand,
        model: data.vehicle.model,
        color: data.vehicle.color,
        plate: data.vehicle.plate || null,
        year: data.vehicle.year ?? null,
        type: data.vehicle.type || 'SEDAN',
        isDefault: true,
      } : undefined
    );

    // Cria o agendamento com veículo vinculado
    const appointment = await appointmentsService.create(
      business.id,
      {
        customerId: customer.id,
        serviceId: data.serviceId,
        date: data.date,
        startTime: data.startTime,
        notes: data.notes,
        vehicleId: vehicle?.id,
      },
      true // isFromPublic = true
    );

    return {
      appointment,
      customer: {
        id: customer.id,
        name: customer.name,
      },
      vehicle: vehicle ? {
        id: vehicle.id,
        brand: vehicle.brand,
        model: vehicle.model,
        color: vehicle.color,
        type: vehicle.type,
      } : null,
      business: {
        name: business.name,
        phone: business.phone,
        address: business.address,
      },
    };
  }
}

export const publicService = new PublicService();
