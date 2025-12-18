import { Router } from 'express';
import { customersController } from './customers.controller';
import { authMiddleware, validateBody, validateParams, validateQuery, requireOnboarding } from '../../shared/middlewares';
import {
  createCustomerSchema,
  updateCustomerSchema,
  customerIdParamsSchema,
  searchCustomerQuerySchema,
  createVehicleSchema,
  updateVehicleSchema,
  vehicleIdParamsSchema,
} from './customers.schemas';

const router = Router();

// Todas as rotas requerem autenticação e onboarding
router.use(authMiddleware, requireOnboarding);

// Criar cliente
router.post(
  '/',
  validateBody(createCustomerSchema),
  customersController.create.bind(customersController)
);

// Listar/buscar clientes
router.get(
  '/',
  validateQuery(searchCustomerQuerySchema),
  customersController.search.bind(customersController)
);

// Buscar cliente por ID
router.get(
  '/:id',
  validateParams(customerIdParamsSchema),
  customersController.getById.bind(customersController)
);

// Atualizar cliente
router.put(
  '/:id',
  validateParams(customerIdParamsSchema),
  validateBody(updateCustomerSchema),
  customersController.update.bind(customersController)
);

// Deletar cliente
router.delete(
  '/:id',
  validateParams(customerIdParamsSchema),
  customersController.delete.bind(customersController)
);

// Histórico de agendamentos do cliente
router.get(
  '/:id/appointments',
  validateParams(customerIdParamsSchema),
  customersController.getAppointments.bind(customersController)
);

// ===========================================
// VEHICLE ROUTES
// ===========================================

// Listar veículos do cliente
router.get(
  '/:id/vehicles',
  validateParams(customerIdParamsSchema),
  customersController.getVehicles.bind(customersController)
);

// Adicionar veículo ao cliente
router.post(
  '/:id/vehicles',
  validateParams(customerIdParamsSchema),
  validateBody(createVehicleSchema),
  customersController.addVehicle.bind(customersController)
);

// Atualizar veículo
router.put(
  '/:id/vehicles/:vehicleId',
  validateParams(vehicleIdParamsSchema),
  validateBody(updateVehicleSchema),
  customersController.updateVehicle.bind(customersController)
);

// Remover veículo
router.delete(
  '/:id/vehicles/:vehicleId',
  validateParams(vehicleIdParamsSchema),
  customersController.deleteVehicle.bind(customersController)
);

export default router;
