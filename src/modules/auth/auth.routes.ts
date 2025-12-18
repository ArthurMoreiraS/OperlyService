import { Router } from 'express';
import { authController } from './auth.controller';
import { authMiddleware, validateBody, authRateLimiter } from '../../shared/middlewares';
import { registerSchema, loginSchema, changePasswordSchema } from './auth.schemas';

const router = Router();

// Rotas públicas (com rate limit para segurança)
router.post(
  '/register',
  authRateLimiter,
  validateBody(registerSchema),
  authController.register.bind(authController)
);

router.post(
  '/login',
  authRateLimiter,
  validateBody(loginSchema),
  authController.login.bind(authController)
);

// Rotas protegidas
router.get(
  '/me',
  authMiddleware,
  authController.getMe.bind(authController)
);

router.put(
  '/change-password',
  authMiddleware,
  validateBody(changePasswordSchema),
  authController.changePassword.bind(authController)
);

export default router;
