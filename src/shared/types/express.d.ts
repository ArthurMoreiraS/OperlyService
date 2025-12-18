import { User, Business } from '@prisma/client';

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  businessId: string | null;
  business: Business | null;
}

export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export type UserWithBusiness = User & {
  business: Business | null;
};
