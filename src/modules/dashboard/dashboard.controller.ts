import { Request, Response, NextFunction } from 'express';
import { dashboardService } from './dashboard.service';
import { ApiResponseHelper, ApiError } from '../../shared/utils';

export class DashboardController {
  /**
   * GET /api/v1/dashboard/stats
   * Retorna estatísticas do dashboard
   */
  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.user!.businessId;

      if (!businessId) {
        throw ApiError.forbidden('Complete o onboarding primeiro');
      }

      const stats = await dashboardService.getStats(businessId);

      res.status(200).json(
        ApiResponseHelper.success(stats)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/dashboard/today
   * Retorna agendamentos de hoje
   */
  async getTodayAppointments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.user!.businessId;

      if (!businessId) {
        throw ApiError.forbidden('Complete o onboarding primeiro');
      }

      const appointments = await dashboardService.getTodayAppointments(businessId);

      res.status(200).json(
        ApiResponseHelper.success(appointments)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/dashboard/upcoming
   * Retorna próximos agendamentos
   */
  async getUpcomingAppointments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.user!.businessId;

      if (!businessId) {
        throw ApiError.forbidden('Complete o onboarding primeiro');
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const appointments = await dashboardService.getUpcomingAppointments(businessId, limit);

      res.status(200).json(
        ApiResponseHelper.success(appointments)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/dashboard/charts/weekly
   * Retorna dados para gráfico de agendamentos da semana
   */
  async getWeeklyChartData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.user!.businessId;

      if (!businessId) {
        throw ApiError.forbidden('Complete o onboarding primeiro');
      }

      const data = await dashboardService.getWeeklyChartData(businessId);

      res.status(200).json(
        ApiResponseHelper.success(data)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/dashboard/charts/revenue
   * Retorna dados para gráfico de receita mensal
   */
  async getMonthlyRevenueData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.user!.businessId;

      if (!businessId) {
        throw ApiError.forbidden('Complete o onboarding primeiro');
      }

      const data = await dashboardService.getMonthlyRevenueData(businessId);

      res.status(200).json(
        ApiResponseHelper.success(data)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/dashboard/comparative
   * Retorna estatísticas comparativas (mês atual vs anterior)
   */
  async getComparativeStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.user!.businessId;

      if (!businessId) {
        throw ApiError.forbidden('Complete o onboarding primeiro');
      }

      const data = await dashboardService.getComparativeStats(businessId);

      res.status(200).json(
        ApiResponseHelper.success(data)
      );
    } catch (error) {
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();
