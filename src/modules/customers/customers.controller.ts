import { Request, Response, NextFunction } from 'express';
import { customersService } from './customers.service';
import { ApiResponseHelper, ApiError } from '../../shared/utils';
import { CreateCustomerInput, UpdateCustomerInput, SearchCustomerQuery, CreateVehicleInput, UpdateVehicleInput } from './customers.schemas';

export class CustomersController {
  /**
   * POST /api/v1/customers
   * Cria um novo cliente
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.user!.businessId;

      if (!businessId) {
        throw ApiError.forbidden('Complete o onboarding primeiro');
      }

      const data = req.body as CreateCustomerInput;
      const customer = await customersService.create(businessId, data);

      res.status(201).json(
        ApiResponseHelper.success(customer, 'Cliente criado com sucesso')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/customers
   * Lista clientes com busca e paginação
   */
  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.user!.businessId;

      if (!businessId) {
        throw ApiError.forbidden('Complete o onboarding primeiro');
      }

      const query = req.query as unknown as SearchCustomerQuery;
      const result = await customersService.search(businessId, query);

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
   * GET /api/v1/customers/:id
   * Busca um cliente por ID
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.user!.businessId;

      if (!businessId) {
        throw ApiError.forbidden('Complete o onboarding primeiro');
      }

      const id = req.params.id as string;
      const customer = await customersService.getById(id, businessId);

      res.status(200).json(
        ApiResponseHelper.success(customer)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/customers/:id
   * Atualiza um cliente
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.user!.businessId;

      if (!businessId) {
        throw ApiError.forbidden('Complete o onboarding primeiro');
      }

      const id = req.params.id as string;
      const data = req.body as UpdateCustomerInput;
      const customer = await customersService.update(id, businessId, data);

      res.status(200).json(
        ApiResponseHelper.success(customer, 'Cliente atualizado com sucesso')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/customers/:id
   * Deleta um cliente
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.user!.businessId;

      if (!businessId) {
        throw ApiError.forbidden('Complete o onboarding primeiro');
      }

      const id = req.params.id as string;
      await customersService.delete(id, businessId);

      res.status(200).json(
        ApiResponseHelper.success(null, 'Cliente excluído com sucesso')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/customers/:id/appointments
   * Histórico de agendamentos do cliente
   */
  async getAppointments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.user!.businessId;

      if (!businessId) {
        throw ApiError.forbidden('Complete o onboarding primeiro');
      }

      const id = req.params.id as string;
      const appointments = await customersService.getAppointmentHistory(id, businessId);

      res.status(200).json(
        ApiResponseHelper.success(appointments)
      );
    } catch (error) {
      next(error);
    }
  }

  // ===========================================
  // VEHICLE ENDPOINTS
  // ===========================================

  /**
   * GET /api/v1/customers/:id/vehicles
   * Lista veículos do cliente
   */
  async getVehicles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.user!.businessId;

      if (!businessId) {
        throw ApiError.forbidden('Complete o onboarding primeiro');
      }

      const id = req.params.id as string;
      const vehicles = await customersService.getVehicles(id, businessId);

      res.status(200).json(
        ApiResponseHelper.success(vehicles)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/customers/:id/vehicles
   * Adiciona veículo ao cliente
   */
  async addVehicle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.user!.businessId;

      if (!businessId) {
        throw ApiError.forbidden('Complete o onboarding primeiro');
      }

      const id = req.params.id as string;
      const data = req.body as CreateVehicleInput;
      const vehicle = await customersService.addVehicle(id, businessId, data);

      res.status(201).json(
        ApiResponseHelper.success(vehicle, 'Veículo adicionado com sucesso')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/customers/:id/vehicles/:vehicleId
   * Atualiza veículo do cliente
   */
  async updateVehicle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.user!.businessId;

      if (!businessId) {
        throw ApiError.forbidden('Complete o onboarding primeiro');
      }

      const { id, vehicleId } = req.params;
      const data = req.body as UpdateVehicleInput;
      const vehicle = await customersService.updateVehicle(id, vehicleId!, businessId, data);

      res.status(200).json(
        ApiResponseHelper.success(vehicle, 'Veículo atualizado com sucesso')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/customers/:id/vehicles/:vehicleId
   * Remove veículo do cliente
   */
  async deleteVehicle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessId = req.user!.businessId;

      if (!businessId) {
        throw ApiError.forbidden('Complete o onboarding primeiro');
      }

      const { id, vehicleId } = req.params;
      await customersService.deleteVehicle(id, vehicleId!, businessId);

      res.status(200).json(
        ApiResponseHelper.success(null, 'Veículo removido com sucesso')
      );
    } catch (error) {
      next(error);
    }
  }
}

export const customersController = new CustomersController();
