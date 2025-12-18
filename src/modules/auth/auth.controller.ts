import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { ApiResponseHelper } from '../../shared/utils';
import { RegisterInput, LoginInput, ChangePasswordInput } from './auth.schemas';

export class AuthController {
  /**
   * POST /api/v1/auth/register
   * Registra um novo usuário
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = req.body as RegisterInput;
      const result = await authService.register(data);

      res.status(201).json(
        ApiResponseHelper.success(result, 'Conta criada com sucesso')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/login
   * Realiza login
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = req.body as LoginInput;
      const result = await authService.login(data);

      res.status(200).json(
        ApiResponseHelper.success(result, 'Login realizado com sucesso')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/auth/me
   * Retorna dados do usuário autenticado
   */
  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const user = await authService.getMe(userId);

      res.status(200).json(
        ApiResponseHelper.success(user)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/auth/change-password
   * Altera a senha do usuário
   */
  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const data = req.body as ChangePasswordInput;

      await authService.changePassword(userId, data);

      res.status(200).json(
        ApiResponseHelper.success(null, 'Senha alterada com sucesso')
      );
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
