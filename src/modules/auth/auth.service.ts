import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma, config } from '../../config';
import { ApiError } from '../../shared/utils';
import { RegisterInput, LoginInput, ChangePasswordInput } from './auth.schemas';

interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    businessId: string | null;
    isOnboarded: boolean;
    business: {
      id: string;
      name: string;
      slug: string;
      phone: string | null;
      address: string | null;
      openTime: string;
      closeTime: string;
      workingDays: string[];
      slotDuration: number;
      monthlyRevenueGoal: number | null;
    } | null;
  };
  token: string;
}

export class AuthService {
  /**
   * Registra um novo usuário
   */
  async register(data: RegisterInput): Promise<AuthResponse> {
    const { name, email, password } = data;

    // Verifica se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw ApiError.conflict('Este email já está em uso');
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12);

    // Cria usuário
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // Gera token
    const token = this.generateToken(user.id);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        businessId: null,
        isOnboarded: false,
        business: null,
      },
      token,
    };
  }

  /**
   * Realiza login
   */
  async login(data: LoginInput): Promise<AuthResponse> {
    const { email, password } = data;

    // Busca usuário
    const user = await prisma.user.findUnique({
      where: { email },
      include: { business: true },
    });

    if (!user) {
      throw ApiError.unauthorized('Email ou senha incorretos');
    }

    // Verifica senha
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw ApiError.unauthorized('Email ou senha incorretos');
    }

    // Gera token
    const token = this.generateToken(user.id);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        businessId: user.business?.id || null,
        isOnboarded: user.business?.isOnboarded || false,
        business: user.business ? {
          id: user.business.id,
          name: user.business.name,
          slug: user.business.slug,
          phone: user.business.phone,
          address: user.business.address,
          openTime: user.business.openTime,
          closeTime: user.business.closeTime,
          workingDays: user.business.workingDays,
          slotDuration: user.business.slotDuration,
          monthlyRevenueGoal: user.business.monthlyRevenueGoal ? Number(user.business.monthlyRevenueGoal) : null,
        } : null,
      },
      token,
    };
  }

  /**
   * Retorna dados do usuário autenticado
   */
  async getMe(userId: string): Promise<{
    id: string;
    name: string;
    email: string;
    businessId: string | null;
    isOnboarded: boolean;
    business: {
      id: string;
      name: string;
      slug: string;
      phone: string | null;
      address: string | null;
      openTime: string;
      closeTime: string;
      workingDays: string[];
      slotDuration: number;
      monthlyRevenueGoal: number | null;
    } | null;
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
            phone: true,
            address: true,
            openTime: true,
            closeTime: true,
            workingDays: true,
            slotDuration: true,
            monthlyRevenueGoal: true,
            isOnboarded: true,
          },
        },
      },
    });

    if (!user) {
      throw ApiError.notFound('Usuário não encontrado');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      businessId: user.business?.id || null,
      isOnboarded: user.business?.isOnboarded || false,
      business: user.business ? {
        id: user.business.id,
        name: user.business.name,
        slug: user.business.slug,
        phone: user.business.phone,
        address: user.business.address,
        openTime: user.business.openTime,
        closeTime: user.business.closeTime,
        workingDays: user.business.workingDays,
        slotDuration: user.business.slotDuration,
        monthlyRevenueGoal: user.business.monthlyRevenueGoal ? Number(user.business.monthlyRevenueGoal) : null,
      } : null,
    };
  }

  /**
   * Altera a senha do usuário
   */
  async changePassword(userId: string, data: ChangePasswordInput): Promise<void> {
    const { currentPassword, newPassword } = data;

    // Busca usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw ApiError.notFound('Usuário não encontrado');
    }

    // Verifica senha atual
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      throw ApiError.unauthorized('Senha atual incorreta');
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Atualiza senha
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  /**
   * Gera JWT token
   */
  private generateToken(userId: string): string {
    const payload = { userId };
    const secret = config.jwt.secret;
    const options = { expiresIn: config.jwt.expiresIn };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return jwt.sign(payload, secret, options as any);
  }
}

export const authService = new AuthService();
