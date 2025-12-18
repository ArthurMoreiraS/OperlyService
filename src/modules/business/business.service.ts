import { prisma } from '../../config';
import { ApiError } from '../../shared/utils';
import { CreateBusinessInput, UpdateBusinessInput } from './business.schemas';
import { Business, DayOfWeek } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export class BusinessService {
  /**
   * Cria um novo business (onboarding)
   */
  async create(userId: string, data: CreateBusinessInput): Promise<Business> {
    // Verifica se usuário já tem um business
    const existingBusiness = await prisma.business.findUnique({
      where: { userId },
    });

    if (existingBusiness) {
      throw ApiError.conflict('Você já possui um estabelecimento cadastrado');
    }

    // Gera slug único a partir do nome
    const slug = await this.generateUniqueSlug(data.name);

    // Cria business
    const business = await prisma.business.create({
      data: {
        userId,
        name: data.name,
        phone: data.phone || null,
        address: data.address || null,
        slug,
        workingDays: data.workingDays as DayOfWeek[],
        openTime: data.openTime,
        closeTime: data.closeTime,
        slotDuration: data.slotDuration,
        isOnboarded: true,
      },
    });

    return business;
  }

  /**
   * Busca business do usuário
   */
  async getByUserId(userId: string): Promise<Business> {
    const business = await prisma.business.findUnique({
      where: { userId },
    });

    if (!business) {
      throw ApiError.notFound('Estabelecimento não encontrado');
    }

    return business;
  }

  /**
   * Busca business por ID
   */
  async getById(businessId: string): Promise<Business> {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw ApiError.notFound('Estabelecimento não encontrado');
    }

    return business;
  }

  /**
   * Busca business por slug (rota pública)
   */
  async getBySlug(slug: string): Promise<Business> {
    const business = await prisma.business.findUnique({
      where: { slug },
    });

    if (!business) {
      throw ApiError.notFound('Estabelecimento não encontrado');
    }

    return business;
  }

  /**
   * Atualiza business
   */
  async update(businessId: string, data: UpdateBusinessInput): Promise<Business> {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw ApiError.notFound('Estabelecimento não encontrado');
    }

    const updatedBusiness = await prisma.business.update({
      where: { id: businessId },
      data: {
        name: data.name,
        phone: data.phone,
        address: data.address,
        imageUrl: data.imageUrl,
        monthlyRevenueGoal: data.monthlyRevenueGoal !== undefined
          ? (data.monthlyRevenueGoal !== null ? new Decimal(data.monthlyRevenueGoal) : null)
          : undefined,
        workingDays: data.workingDays as DayOfWeek[] | undefined,
        openTime: data.openTime,
        closeTime: data.closeTime,
        slotDuration: data.slotDuration,
      },
    });

    return updatedBusiness;
  }

  /**
   * Verifica se slug está disponível
   */
  async isSlugAvailable(slug: string, excludeBusinessId?: string): Promise<boolean> {
    const business = await prisma.business.findUnique({
      where: { slug },
    });

    if (!business) return true;
    if (excludeBusinessId && business.id === excludeBusinessId) return true;

    return false;
  }

  /**
   * Gera slug único a partir do nome
   */
  private async generateUniqueSlug(name: string): Promise<string> {
    // Normaliza o nome para slug
    let slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9]+/g, '-') // Substitui caracteres especiais por hífen
      .replace(/^-+|-+$/g, '') // Remove hífens do início e fim
      .substring(0, 50);

    // Verifica se já existe
    const isAvailable = await this.isSlugAvailable(slug);

    if (isAvailable) {
      return slug;
    }

    // Se existir, adiciona sufixo numérico
    let counter = 1;
    let newSlug = `${slug}-${counter}`;

    while (!(await this.isSlugAvailable(newSlug))) {
      counter++;
      newSlug = `${slug}-${counter}`;

      // Segurança: limita tentativas
      if (counter > 100) {
        // Usa parte do timestamp
        newSlug = `${slug}-${Date.now().toString(36)}`;
        break;
      }
    }

    return newSlug;
  }
}

export const businessService = new BusinessService();
