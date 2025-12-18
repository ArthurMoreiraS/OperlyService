import { prisma } from '../../config';
import { ApiError } from '../../shared/utils';
import { CreateCustomerInput, UpdateCustomerInput, SearchCustomerQuery, CreateVehicleInput, UpdateVehicleInput } from './customers.schemas';
import { Customer, Vehicle } from '@prisma/client';

interface CustomerWithVehicles extends Customer {
  vehicles?: Vehicle[];
}

interface PaginatedCustomers {
  data: CustomerWithVehicles[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class CustomersService {
  /**
   * Cria um novo cliente
   */
  async create(businessId: string, data: CreateCustomerInput): Promise<CustomerWithVehicles> {
    // Verifica se já existe cliente com mesmo telefone
    const existingCustomer = await prisma.customer.findUnique({
      where: {
        businessId_phone: {
          businessId,
          phone: data.phone,
        },
      },
    });

    if (existingCustomer) {
      throw ApiError.conflict('Já existe um cliente com este telefone');
    }

    const customer = await prisma.customer.create({
      data: {
        businessId,
        name: data.name,
        phone: data.phone,
        notes: data.notes || null,
        // Cria veículo se fornecido
        ...(data.vehicle && {
          vehicles: {
            create: {
              brand: data.vehicle.brand,
              model: data.vehicle.model,
              color: data.vehicle.color,
              plate: data.vehicle.plate || null,
              year: data.vehicle.year || null,
              type: data.vehicle.type || 'SEDAN',
              isDefault: true,
            },
          },
        }),
      },
      include: {
        vehicles: true,
      },
    });

    return customer;
  }

  /**
   * Lista clientes com busca e paginação
   */
  async search(businessId: string, query: SearchCustomerQuery): Promise<PaginatedCustomers> {
    const { q, page, limit } = query;
    const skip = (page - 1) * limit;

    const where = {
      businessId,
      ...(q && {
        OR: [
          { name: { contains: q, mode: 'insensitive' as const } },
          { phone: { contains: q } },
        ],
      }),
    };

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
        include: {
          vehicles: {
            orderBy: { isDefault: 'desc' },
          },
          _count: {
            select: { appointments: true },
          },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    return {
      data: customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Busca cliente por ID
   */
  async getById(customerId: string, businessId: string): Promise<CustomerWithVehicles> {
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        businessId,
      },
      include: {
        vehicles: {
          orderBy: { isDefault: 'desc' },
        },
      },
    });

    if (!customer) {
      throw ApiError.notFound('Cliente não encontrado');
    }

    return customer;
  }

  /**
   * Busca cliente por telefone
   */
  async getByPhone(phone: string, businessId: string): Promise<CustomerWithVehicles | null> {
    const customer = await prisma.customer.findUnique({
      where: {
        businessId_phone: {
          businessId,
          phone,
        },
      },
      include: {
        vehicles: {
          orderBy: { isDefault: 'desc' },
        },
      },
    });

    return customer;
  }

  /**
   * Busca ou cria cliente por telefone (usado no agendamento público)
   * Também cria veículo se fornecido
   */
  async findOrCreateWithVehicle(
    businessId: string,
    name: string,
    phone: string,
    vehicleData?: CreateVehicleInput
  ): Promise<{ customer: CustomerWithVehicles; vehicle: Vehicle | null }> {
    let customer = await this.getByPhone(phone, businessId);
    let vehicle: Vehicle | null = null;

    if (!customer) {
      // Cria novo cliente com veículo se fornecido
      customer = await prisma.customer.create({
        data: {
          businessId,
          name,
          phone,
          ...(vehicleData && {
            vehicles: {
              create: {
                brand: vehicleData.brand,
                model: vehicleData.model,
                color: vehicleData.color,
                plate: vehicleData.plate || null,
                year: vehicleData.year || null,
                type: vehicleData.type || 'SEDAN',
                isDefault: true,
              },
            },
          }),
        },
        include: {
          vehicles: {
            orderBy: { isDefault: 'desc' },
          },
        },
      });
      vehicle = customer.vehicles?.[0] || null;
    } else if (vehicleData) {
      // Cliente existe, verifica se já tem esse veículo ou cria um novo
      const existingVehicle = await prisma.vehicle.findFirst({
        where: {
          customerId: customer.id,
          brand: vehicleData.brand,
          model: vehicleData.model,
          color: vehicleData.color,
        },
      });

      if (existingVehicle) {
        vehicle = existingVehicle;
      } else {
        // Cria novo veículo para o cliente
        vehicle = await prisma.vehicle.create({
          data: {
            customerId: customer.id,
            brand: vehicleData.brand,
            model: vehicleData.model,
            color: vehicleData.color,
            plate: vehicleData.plate || null,
            year: vehicleData.year || null,
            type: vehicleData.type || 'SEDAN',
            isDefault: false, // Não é default se cliente já existe
          },
        });
        // Atualiza o customer com o novo veículo
        customer = await this.getById(customer.id, businessId);
      }
    } else {
      // Cliente existe mas sem veículo novo - pega veículo default se existir
      vehicle = customer.vehicles?.find(v => v.isDefault) || customer.vehicles?.[0] || null;
    }

    return { customer, vehicle };
  }

  /**
   * Busca ou cria cliente por telefone (legado - mantido para compatibilidade)
   */
  async findOrCreate(businessId: string, name: string, phone: string): Promise<Customer> {
    const { customer } = await this.findOrCreateWithVehicle(businessId, name, phone);
    return customer;
  }

  /**
   * Atualiza um cliente
   */
  async update(customerId: string, businessId: string, data: UpdateCustomerInput): Promise<CustomerWithVehicles> {
    // Verifica se cliente existe e pertence ao business
    await this.getById(customerId, businessId);

    // Se está atualizando telefone, verifica unicidade
    if (data.phone) {
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          businessId,
          phone: data.phone,
          NOT: { id: customerId },
        },
      });

      if (existingCustomer) {
        throw ApiError.conflict('Já existe um cliente com este telefone');
      }
    }

    const customer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        name: data.name,
        phone: data.phone,
        notes: data.notes,
      },
      include: {
        vehicles: {
          orderBy: { isDefault: 'desc' },
        },
      },
    });

    return customer;
  }

  // ===========================================
  // VEHICLE CRUD
  // ===========================================

  /**
   * Adiciona um veículo ao cliente
   */
  async addVehicle(customerId: string, businessId: string, data: CreateVehicleInput): Promise<Vehicle> {
    // Verifica se cliente existe
    await this.getById(customerId, businessId);

    // Se é para ser default, remove default dos outros
    if (data.isDefault) {
      await prisma.vehicle.updateMany({
        where: { customerId },
        data: { isDefault: false },
      });
    }

    // Se é o primeiro veículo, define como default
    const vehicleCount = await prisma.vehicle.count({ where: { customerId } });
    const shouldBeDefault = data.isDefault || vehicleCount === 0;

    const vehicle = await prisma.vehicle.create({
      data: {
        customerId,
        brand: data.brand,
        model: data.model,
        color: data.color,
        plate: data.plate || null,
        year: data.year || null,
        type: data.type || 'SEDAN',
        isDefault: shouldBeDefault,
      },
    });

    return vehicle;
  }

  /**
   * Atualiza um veículo
   */
  async updateVehicle(
    customerId: string,
    vehicleId: string,
    businessId: string,
    data: UpdateVehicleInput
  ): Promise<Vehicle> {
    // Verifica se cliente existe
    await this.getById(customerId, businessId);

    // Verifica se veículo existe e pertence ao cliente
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, customerId },
    });

    if (!vehicle) {
      throw ApiError.notFound('Veículo não encontrado');
    }

    // Se está definindo como default, remove default dos outros
    if (data.isDefault) {
      await prisma.vehicle.updateMany({
        where: { customerId, NOT: { id: vehicleId } },
        data: { isDefault: false },
      });
    }

    const updatedVehicle = await prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        brand: data.brand,
        model: data.model,
        color: data.color,
        plate: data.plate,
        year: data.year,
        type: data.type,
        isDefault: data.isDefault,
      },
    });

    return updatedVehicle;
  }

  /**
   * Remove um veículo
   */
  async deleteVehicle(customerId: string, vehicleId: string, businessId: string): Promise<void> {
    // Verifica se cliente existe
    await this.getById(customerId, businessId);

    // Verifica se veículo existe e pertence ao cliente
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, customerId },
    });

    if (!vehicle) {
      throw ApiError.notFound('Veículo não encontrado');
    }

    await prisma.vehicle.delete({
      where: { id: vehicleId },
    });

    // Se era o default, define outro como default
    if (vehicle.isDefault) {
      const firstVehicle = await prisma.vehicle.findFirst({
        where: { customerId },
      });
      if (firstVehicle) {
        await prisma.vehicle.update({
          where: { id: firstVehicle.id },
          data: { isDefault: true },
        });
      }
    }
  }

  /**
   * Lista veículos de um cliente
   */
  async getVehicles(customerId: string, businessId: string): Promise<Vehicle[]> {
    // Verifica se cliente existe
    await this.getById(customerId, businessId);

    const vehicles = await prisma.vehicle.findMany({
      where: { customerId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return vehicles;
  }

  /**
   * Deleta um cliente
   */
  async delete(customerId: string, businessId: string): Promise<void> {
    // Verifica se cliente existe e pertence ao business
    await this.getById(customerId, businessId);

    // Verifica se há agendamentos vinculados
    const appointmentsCount = await prisma.appointment.count({
      where: { customerId },
    });

    if (appointmentsCount > 0) {
      throw ApiError.conflict(
        'Não é possível excluir cliente com agendamentos. Exclua os agendamentos primeiro.'
      );
    }

    await prisma.customer.delete({
      where: { id: customerId },
    });
  }

  /**
   * Busca histórico de agendamentos do cliente
   */
  async getAppointmentHistory(customerId: string, businessId: string) {
    // Verifica se cliente existe
    await this.getById(customerId, businessId);

    const appointments = await prisma.appointment.findMany({
      where: { customerId },
      include: {
        service: {
          select: { name: true, price: true },
        },
      },
      orderBy: { date: 'desc' },
      take: 10, // Últimos 10 agendamentos
    });

    return appointments;
  }
}

export const customersService = new CustomersService();
