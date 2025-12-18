import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authMiddleware, requireOnboarding } from '../../shared/middlewares';

const router = Router();

// Todas as rotas requerem autenticação e onboarding
router.use(authMiddleware, requireOnboarding);

// Estatísticas
router.get(
  '/stats',
  dashboardController.getStats.bind(dashboardController)
);

// Agendamentos de hoje
router.get(
  '/today',
  dashboardController.getTodayAppointments.bind(dashboardController)
);

// Próximos agendamentos
router.get(
  '/upcoming',
  dashboardController.getUpcomingAppointments.bind(dashboardController)
);

// Dados para gráfico semanal
router.get(
  '/charts/weekly',
  dashboardController.getWeeklyChartData.bind(dashboardController)
);

// Dados para gráfico de receita mensal
router.get(
  '/charts/revenue',
  dashboardController.getMonthlyRevenueData.bind(dashboardController)
);

// Estatísticas comparativas
router.get(
  '/comparative',
  dashboardController.getComparativeStats.bind(dashboardController)
);

export default router;
