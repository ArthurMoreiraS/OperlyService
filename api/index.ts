import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

// Import routes
import { authRoutes } from '../src/modules/auth';
import { businessRoutes } from '../src/modules/business';
import { servicesRoutes } from '../src/modules/services';
import { customersRoutes } from '../src/modules/customers';
import { appointmentsRoutes } from '../src/modules/appointments';
import { dashboardRoutes } from '../src/modules/dashboard';
import { publicRoutes } from '../src/modules/public';
import { billingRoutes } from '../src/modules/billing';
import { errorMiddleware } from '../src/shared/middlewares';
import { config } from '../src/config';

const app = express();

// Security
app.use(helmet());
app.use(cors({
  origin: config.cors.origins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Operly API is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// API Routes
const API_PREFIX = '/api/v1';
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/business`, businessRoutes);
app.use(`${API_PREFIX}/services`, servicesRoutes);
app.use(`${API_PREFIX}/customers`, customersRoutes);
app.use(`${API_PREFIX}/appointments`, appointmentsRoutes);
app.use(`${API_PREFIX}/dashboard`, dashboardRoutes);
app.use(`${API_PREFIX}/public`, publicRoutes);
app.use(`${API_PREFIX}/billing`, billingRoutes);

// 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada',
  });
});

// Error handler
app.use(errorMiddleware);

export default app;
