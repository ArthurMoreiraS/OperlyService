import { prisma } from '../../config';
import { ApiError } from '../../shared/utils';
import { CreateServiceInput, UpdateServiceInput } from './services.schemas';
import { Service } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// Tipo de serviço com price convertido para number
interface ServiceResponse {
  id: string;
  businessId: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Helper para converter Decimal para number
function toServiceResponse(service: Service): ServiceResponse {
  return {
    ...service,
    price: Number(service.price),
  };
}

export class ServicesService {
  /**
   * Cria um novo serviço
   */
  async create(businessId: string, data: CreateServiceInput): Promise<ServiceResponse> {
    const service = await prisma.service.create({
      data: {
        businessId,
        name: data.name,
        description: data.description,
        price: new Decimal(data.price),
        duration: data.duration,
        isActive: data.isActive,
      },
    });

    return toServiceResponse(service);
  }

  /**
   * Lista todos os serviços do business
   */
  async getAll(businessId: string, onlyActive = false): Promise<ServiceResponse[]> {
    const services = await prisma.service.findMany({
      where: {
        businessId,
        ...(onlyActive && { isActive: true }),
      },
      orderBy: { name: 'asc' },
    });

    return services.map(toServiceResponse);
  }

  /**
   * Busca serviço por ID
   */
  async getById(serviceId: string, businessId: string): Promise<ServiceResponse> {
    const service = await prisma.service.findFirst({
      where: {
        id: serviceId,
        businessId,
      },
    });

    if (!service) {
      throw ApiError.notFound('Serviço não encontrado');
    }

    return toServiceResponse(service);
  }

  /**
   * Atualiza um serviço
   */
  async update(serviceId: string, businessId: string, data: UpdateServiceInput): Promise<ServiceResponse> {
    // Verifica se serviço existe e pertence ao business
    await this.getById(serviceId, businessId);

    const service = await prisma.service.update({
      where: { id: serviceId },
      data: {
        name: data.name,
        description: data.description,
        price: data.price !== undefined ? new Decimal(data.price) : undefined,
        duration: data.duration,
        isActive: data.isActive,
      },
    });

    return toServiceResponse(service);
  }

  /**
   * Deleta um serviço
   */
  async delete(serviceId: string, businessId: string): Promise<void> {
    // Verifica se serviço existe e pertence ao business
    await this.getById(serviceId, businessId);

    // Verifica se há agendamentos vinculados
    const appointmentsCount = await prisma.appointment.count({
      where: { serviceId },
    });

    if (appointmentsCount > 0) {
      throw ApiError.conflict(
        'Não é possível excluir serviço com agendamentos. Desative-o ao invés de excluir.'
      );
    }

    await prisma.service.delete({
      where: { id: serviceId },
    });
  }

  /**
   * Ativa/desativa um serviço
   */
  async toggleActive(serviceId: string, businessId: string): Promise<ServiceResponse> {
    const service = await this.getById(serviceId, businessId);

    const updatedService = await prisma.service.update({
      where: { id: serviceId },
      data: { isActive: !service.isActive },
    });

    return toServiceResponse(updatedService);
  }
}

export const servicesService = new ServicesService();
