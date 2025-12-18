import { Request, Response, NextFunction } from 'express';
import { publicService } from './public.service';
import { ApiResponseHelper } from '../../shared/utils';
import { PublicSlotsQuery, PublicBookInput } from './public.schemas';

export class PublicController {
  /**
   * GET /api/v1/public/:slug
   * Retorna dados públicos do estabelecimento
   */
  async getBusiness(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const slug = req.params.slug as string;
      const business = await publicService.getBusinessBySlug(slug);

      res.status(200).json(
        ApiResponseHelper.success(business)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/public/:slug/services
   * Lista serviços ativos do estabelecimento
   */
  async getServices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const slug = req.params.slug as string;
      const services = await publicService.getServices(slug);

      res.status(200).json(
        ApiResponseHelper.success(services)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/public/:slug/slots
   * Retorna slots disponíveis
   */
  async getAvailableSlots(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const slug = req.params.slug as string;
      const query = req.query as unknown as PublicSlotsQuery;
      const slots = await publicService.getAvailableSlots(slug, query);

      res.status(200).json(
        ApiResponseHelper.success(slots)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/public/:slug/book
   * Realiza agendamento público
   */
  async bookAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const slug = req.params.slug as string;
      const data = req.body as PublicBookInput;
      const result = await publicService.bookAppointment(slug, data);

      res.status(201).json(
        ApiResponseHelper.success(result, 'Agendamento realizado com sucesso!')
      );
    } catch (error) {
      next(error);
    }
  }
}

export const publicController = new PublicController();
