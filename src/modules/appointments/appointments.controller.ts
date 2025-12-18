import { Request, Response, NextFunction } from 'express';
import { appointmentsService } from './appointments.service';
import { ApiResponseHelper, ApiError } from '../../shared/utils';
import {
  CreateAppointmentInput,
  UpdateAppointmentInput,
  UpdateStatusInput,
  ListAppointmentsQuery,
  AvailableSlotsQuery
} from './appointments.schemas';

export class AppointmentsController {
  /**
   * POST /api/v1/appointments
   * Cria um novo agendamento
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.user!.businessId;

      if (!businessId) {
        throw ApiError.forbidden('Complete o onboarding primeiro');
      }

      const data = req.body as CreateAppointmentInput;
      const appointment = await appointmentsService.create(businessId, data, false);

      res.status(201).json(
        ApiResponseHelper.success(appointment, 'Agendamento criado com sucesso')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/appointments
   * Lista agendamentos com filtros
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.user!.businessId;

      if (!businessId) {
        throw ApiError.forbidden('Complete o onboarding primeiro');
      }

      const query = req.query as unknown as ListAppointmentsQuery;
      const result = await appointmentsService.list(businessId, query);

      res.status(200).json(
        ApiResponseHelper.paginated(
          result.data,
          result.pagination.page,
          result.pagination.limit,
          result.pagination.total
        )
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/appointments/slots
   * Retorna slots disponíveis
   */
  async getAvailableSlots(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.user!.businessId;

      if (!businessId) {
        throw ApiError.forbidden('Complete o onboarding primeiro');
      }

      const query = req.query as unknown as AvailableSlotsQuery;
      const slots = await appointmentsService.getAvailableSlots(businessId, query);

      res.status(200).json(
        ApiResponseHelper.success(slots)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/appointments/:id
   * Busca agendamento por ID
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.user!.businessId;

      if (!businessId) {
        throw ApiError.forbidden('Complete o onboarding primeiro');
      }

      const id = req.params.id as string;
      const appointment = await appointmentsService.getById(id, businessId);

      res.status(200).json(
        ApiResponseHelper.success(appointment)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/appointments/:id
   * Atualiza um agendamento
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.user!.businessId;

      if (!businessId) {
        throw ApiError.forbidden('Complete o onboarding primeiro');
      }

      const id = req.params.id as string;
      const data = req.body as UpdateAppointmentInput;
      const appointment = await appointmentsService.update(id, businessId, data);

      res.status(200).json(
        ApiResponseHelper.success(appointment, 'Agendamento atualizado com sucesso')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/appointments/:id/status
   * Atualiza status do agendamento
   */
  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.user!.businessId;

      if (!businessId) {
        throw ApiError.forbidden('Complete o onboarding primeiro');
      }

      const id = req.params.id as string;
      const { status } = req.body as UpdateStatusInput;
      const appointment = await appointmentsService.updateStatus(id, businessId, status);

      res.status(200).json(
        ApiResponseHelper.success(appointment, 'Status atualizado com sucesso')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/appointments/:id
   * Deleta um agendamento
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.user!.businessId;

      if (!businessId) {
        throw ApiError.forbidden('Complete o onboarding primeiro');
      }

      const id = req.params.id as string;
      await appointmentsService.delete(id, businessId);

      res.status(200).json(
        ApiResponseHelper.success(null, 'Agendamento excluído com sucesso')
      );
    } catch (error) {
      next(error);
    }
  }
}

export const appointmentsController = new AppointmentsController();
