import { Router } from 'express';
import { servicesController } from './services.controller';
import { authMiddleware, validateBody, validateParams, requireOnboarding } from '../../shared/middlewares';
import { createServiceSchema, updateServiceSchema, serviceIdParamsSchema } from './services.schemas';

const router = Router();

// Todas as rotas requerem autenticação e onboarding
router.use(authMiddleware, requireOnboarding);

// Criar serviço
router.post(
  '/',
  validateBody(createServiceSchema),
  servicesController.create.bind(servicesController)
);

// Listar serviços
router.get(
  '/',
  servicesController.getAll.bind(servicesController)
);

// Buscar serviço por ID
router.get(
  '/:id',
  validateParams(serviceIdParamsSchema),
  servicesController.getById.bind(servicesController)
);

// Atualizar serviço
router.put(
  '/:id',
  validateParams(serviceIdParamsSchema),
  validateBody(updateServiceSchema),
  servicesController.update.bind(servicesController)
);

// Deletar serviço
router.delete(
  '/:id',
  validateParams(serviceIdParamsSchema),
  servicesController.delete.bind(servicesController)
);

// Toggle ativo/inativo
router.patch(
  '/:id/toggle',
  validateParams(serviceIdParamsSchema),
  servicesController.toggleActive.bind(servicesController)
);

export default router;
