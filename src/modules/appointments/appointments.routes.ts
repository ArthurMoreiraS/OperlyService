import { Router } from 'express';
import { appointmentsController } from './appointments.controller';
import { authMiddleware, validateBody, validateParams, validateQuery, requireOnboarding } from '../../shared/middlewares';
import {
  createAppointmentSchema,
  updateAppointmentSchema,
  updateStatusSchema,
  appointmentIdParamsSchema,
  listAppointmentsQuerySchema,
  availableSlotsQuerySchema
} from './appointments.schemas';

const router = Router();

// Todas as rotas requerem autenticação e onboarding
router.use(authMiddleware, requireOnboarding);

// Criar agendamento
router.post(
  '/',
  validateBody(createAppointmentSchema),
  appointmentsController.create.bind(appointmentsController)
);

// Listar agendamentos
router.get(
  '/',
  validateQuery(listAppointmentsQuerySchema),
  appointmentsController.list.bind(appointmentsController)
);

// Slots disponíveis (deve vir antes de /:id)
router.get(
  '/slots',
  validateQuery(availableSlotsQuerySchema),
  appointmentsController.getAvailableSlots.bind(appointmentsController)
);

// Buscar agendamento por ID
router.get(
  '/:id',
  validateParams(appointmentIdParamsSchema),
  appointmentsController.getById.bind(appointmentsController)
);

// Atualizar agendamento
router.put(
  '/:id',
  validateParams(appointmentIdParamsSchema),
  validateBody(updateAppointmentSchema),
  appointmentsController.update.bind(appointmentsController)
);

// Atualizar status
router.patch(
  '/:id/status',
  validateParams(appointmentIdParamsSchema),
  validateBody(updateStatusSchema),
  appointmentsController.updateStatus.bind(appointmentsController)
);

// Deletar agendamento
router.delete(
  '/:id',
  validateParams(appointmentIdParamsSchema),
  appointmentsController.delete.bind(appointmentsController)
);

export default router;
