import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config, prisma } from '../../config';
import { ApiError } from '../utils';
import { JwtPayload, AuthenticatedUser } from '../types';

export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw ApiError.unauthorized('Token não fornecido');
    }

    const parts = authHeader.split(' ');
    const scheme = parts[0] || '';
    const token = parts[1] || '';

    if (!/^Bearer$/i.test(scheme) || !token) {
      throw ApiError.unauthorized('Token mal formatado');
    }

    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { business: true },
    });

    if (!user) {
      throw ApiError.unauthorized('Usuário não encontrado');
    }

    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      businessId: user.business?.id || null,
      business: user.business,
    };

    req.user = authenticatedUser;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(ApiError.unauthorized('Token inválido'));
      return;
    }
    if (error instanceof jwt.TokenExpiredError) {
      next(ApiError.unauthorized('Token expirado'));
      return;
    }
    next(error);
  }
}

/**
 * Middleware que exige que o usuário tenha completado o onboarding
 */
export async function requireOnboarding(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user?.business?.isOnboarded) {
    next(ApiError.forbidden('Complete o onboarding primeiro'));
    return;
  }
  next();
}

/**
 * Middleware opcional de autenticação (não bloqueia se não houver token)
 */
export async function optionalAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      next();
      return;
    }

    const parts = authHeader.split(' ');
    const scheme = parts[0] || '';
    const token = parts[1] || '';

    if (!/^Bearer$/i.test(scheme) || !token) {
      next();
      return;
    }

    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { business: true },
    });

    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        businessId: user.business?.id || null,
        business: user.business,
      };
    }

    next();
  } catch {
    // Ignora erros de token e continua sem autenticação
    next();
  }
}
