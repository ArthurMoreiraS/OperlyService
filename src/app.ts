import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { config } from './config';
import { errorMiddleware, rateLimiter } from './shared/middlewares';

// Import routes
import { authRoutes } from './modules/auth';
import { businessRoutes } from './modules/business';
import { servicesRoutes } from './modules/services';
import { customersRoutes } from './modules/customers';
import { appointmentsRoutes } from './modules/appointments';
import { dashboardRoutes } from './modules/dashboard';
import { publicRoutes } from './modules/public';
import { billingRoutes } from './modules/billing';

export function createApp(): Application {
  const app = express();

  // ===========================================
  // SECURITY MIDDLEWARES
  // ===========================================

  // Helmet - Headers de segurança
  app.use(helmet());

  // CORS
  app.use(cors({
    origin: config.cors.origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Rate limiting (desabilitado em dev)
  app.use(rateLimiter);

  // ===========================================
  // PARSING & UTILITY MIDDLEWARES
  // ===========================================

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Compression
  app.use(compression());

  // Request logging
  if (config.isDevelopment) {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }

  // ===========================================
  // HEALTH CHECK
  // ===========================================

  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message: 'Operly API is running',
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
    });
  });

  // ===========================================
  // API ROUTES
  // ===========================================

  const API_PREFIX = '/api/v1';

  // Rotas da API
  app.use(`${API_PREFIX}/auth`, authRoutes);
  app.use(`${API_PREFIX}/business`, businessRoutes);
  app.use(`${API_PREFIX}/services`, servicesRoutes);
  app.use(`${API_PREFIX}/customers`, customersRoutes);
  app.use(`${API_PREFIX}/appointments`, appointmentsRoutes);
  app.use(`${API_PREFIX}/dashboard`, dashboardRoutes);
  app.use(`${API_PREFIX}/public`, publicRoutes);
  app.use(`${API_PREFIX}/billing`, billingRoutes);

  // ===========================================
  // 404 HANDLER
  // ===========================================

  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: 'Rota não encontrada',
    });
  });

  // ===========================================
  // ERROR HANDLER (deve ser o último)
  // ===========================================

  app.use(errorMiddleware);

  return app;
}

export default createApp();
