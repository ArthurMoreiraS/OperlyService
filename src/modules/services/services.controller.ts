import { Request, Response, NextFunction } from 'express';
import { servicesService } from './services.service';
import { ApiResponseHelper, ApiError } from '../../shared/utils';
import { CreateServiceInput, UpdateServiceInput } from './services.schemas';

export class ServicesController {
  /**
   * POST /api/v1/services
   * Cria um novo serviço
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.user!.businessId;

      if (!businessId) {
        throw ApiError.forbidden('Complete o onboarding primeiro');
      }

      const data = req.body as CreateServiceInput;
      const service = await servicesService.create(businessId, data);

      res.status(201).json(
        ApiResponseHelper.success(service, 'Serviço criado com sucesso')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/services
   * Lista todos os serviços do business
   */
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.user!.businessId;

      if (!businessId) {
        throw ApiError.forbidden('Complete o onboarding primeiro');
      }

      const onlyActive = req.query.active === 'true';
      const services = await servicesService.getAll(businessId, onlyActive);

      res.status(200).json(
        ApiResponseHelper.success(services)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/services/:id
   * Busca um serviço por ID
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.user!.businessId;

      if (!businessId) {
        throw ApiError.forbidden('Complete o onboarding primeiro');
      }

      const id = req.params.id as string;
      const service = await servicesService.getById(id, businessId);

      res.status(200).json(
        ApiResponseHelper.success(service)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/services/:id
   * Atualiza um serviço
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.user!.businessId;

      if (!businessId) {
        throw ApiError.forbidden('Complete o onboarding primeiro');
      }

      const id = req.params.id as string;
      const data = req.body as UpdateServiceInput;
      const service = await servicesService.update(id, businessId, data);

      res.status(200).json(
        ApiResponseHelper.success(service, 'Serviço atualizado com sucesso')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/services/:id
   * Deleta um serviço
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.user!.businessId;

      if (!businessId) {
        throw ApiError.forbidden('Complete o onboarding primeiro');
      }

      const id = req.params.id as string;
      await servicesService.delete(id, businessId);

      res.status(200).json(
        ApiResponseHelper.success(null, 'Serviço excluído com sucesso')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/services/:id/toggle
   * Ativa/desativa um serviço
   */
  async toggleActive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.user!.businessId;

      if (!businessId) {
        throw ApiError.forbidden('Complete o onboarding primeiro');
      }

      const id = req.params.id as string;
      const service = await servicesService.toggleActive(id, businessId);
      const message = service.isActive ? 'Serviço ativado' : 'Serviço desativado';

      res.status(200).json(
        ApiResponseHelper.success(service, message)
      );
    } catch (error) {
      next(error);
    }
  }
}

export const servicesController = new ServicesController();
