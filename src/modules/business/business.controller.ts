import { Request, Response, NextFunction } from 'express';
import { businessService } from './business.service';
import { ApiResponseHelper } from '../../shared/utils';
import { CreateBusinessInput, UpdateBusinessInput } from './business.schemas';

export class BusinessController {
  /**
   * POST /api/v1/business
   * Cria um novo business (onboarding)
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const data = req.body as CreateBusinessInput;
      const business = await businessService.create(userId, data);

      res.status(201).json(
        ApiResponseHelper.success(business, 'Estabelecimento criado com sucesso')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/business
   * Retorna o business do usuário autenticado
   */
  async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const business = await businessService.getByUserId(userId);

      res.status(200).json(
        ApiResponseHelper.success(business)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/business
   * Atualiza o business do usuário autenticado
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.user!.businessId;

      if (!businessId) {
        res.status(404).json(
          ApiResponseHelper.error('Estabelecimento não encontrado')
        );
        return;
      }

      const data = req.body as UpdateBusinessInput;
      const business = await businessService.update(businessId, data);

      res.status(200).json(
        ApiResponseHelper.success(business, 'Estabelecimento atualizado com sucesso')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/business/check-slug/:slug
   * Verifica se um slug está disponível
   */
  async checkSlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const slug = req.params.slug as string;
      const businessId = req.user?.businessId || undefined;
      const isAvailable = await businessService.isSlugAvailable(slug, businessId);

      res.status(200).json(
        ApiResponseHelper.success({
          slug,
          isAvailable,
        })
      );
    } catch (error) {
      next(error);
    }
  }
}

export const businessController = new BusinessController();
