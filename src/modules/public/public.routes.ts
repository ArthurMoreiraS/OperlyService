import { Router } from 'express';
import { publicController } from './public.controller';
import { validateBody, validateParams, validateQuery } from '../../shared/middlewares';
import { publicSlugParamsSchema, publicSlotsQuerySchema, publicBookSchema } from './public.schemas';

const router = Router();

// Todas as rotas são públicas (sem autenticação)

// Buscar estabelecimento por slug
router.get(
  '/:slug',
  validateParams(publicSlugParamsSchema),
  publicController.getBusiness.bind(publicController)
);

// Listar serviços do estabelecimento
router.get(
  '/:slug/services',
  validateParams(publicSlugParamsSchema),
  publicController.getServices.bind(publicController)
);

// Slots disponíveis
router.get(
  '/:slug/slots',
  validateParams(publicSlugParamsSchema),
  validateQuery(publicSlotsQuerySchema),
  publicController.getAvailableSlots.bind(publicController)
);

// Agendar (cliente sem login)
router.post(
  '/:slug/book',
  validateParams(publicSlugParamsSchema),
  validateBody(publicBookSchema),
  publicController.bookAppointment.bind(publicController)
);

export default router;
