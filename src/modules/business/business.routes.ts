import { Router } from 'express';
import { businessController } from './business.controller';
import { authMiddleware, validateBody, validateParams } from '../../shared/middlewares';
import { createBusinessSchema, updateBusinessSchema, slugParamsSchema } from './business.schemas';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Criar business (onboarding)
router.post(
  '/',
  validateBody(createBusinessSchema),
  businessController.create.bind(businessController)
);

// Buscar business do usuário
router.get(
  '/',
  businessController.get.bind(businessController)
);

// Atualizar business
router.put(
  '/',
  validateBody(updateBusinessSchema),
  businessController.update.bind(businessController)
);

// Verificar disponibilidade de slug
router.get(
  '/check-slug/:slug',
  validateParams(slugParamsSchema),
  businessController.checkSlug.bind(businessController)
);

export default router;
