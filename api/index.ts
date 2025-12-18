import type { VercelRequest, VercelResponse } from '@vercel/node';
import express, { Request, Response, NextFunction } from 'express';
import compression from 'compression';

// Criar app uma única vez (reutilizado em warm starts)
let app: express.Application | null = null;
let routesLoaded = false;

// Middleware CORS manual
function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Responder imediatamente para OPTIONS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  next();
}

function getApp(): express.Application {
  if (app) return app;

  app = express();

  // CORS - primeira coisa a ser executada
  app.use(corsMiddleware);

  // Parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(compression());

  // Health check (sempre funciona, sem dependências)
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message: 'Operly API is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    });
  });

  return app;
}

// Handler para Vercel
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const expressApp = getApp();

  // Carregar rotas apenas uma vez
  if (!routesLoaded) {
    try {
      // Import routes
      const { authRoutes } = await import('../src/modules/auth');
      const { businessRoutes } = await import('../src/modules/business');
      const { servicesRoutes } = await import('../src/modules/services');
      const { customersRoutes } = await import('../src/modules/customers');
      const { appointmentsRoutes } = await import('../src/modules/appointments');
      const { dashboardRoutes } = await import('../src/modules/dashboard');
      const { publicRoutes } = await import('../src/modules/public');
      const { billingRoutes } = await import('../src/modules/billing');
      const { errorMiddleware } = await import('../src/shared/middlewares');

      // Mount routes
      const API_PREFIX = '/api/v1';
      expressApp.use(`${API_PREFIX}/auth`, authRoutes);
      expressApp.use(`${API_PREFIX}/business`, businessRoutes);
      expressApp.use(`${API_PREFIX}/services`, servicesRoutes);
      expressApp.use(`${API_PREFIX}/customers`, customersRoutes);
      expressApp.use(`${API_PREFIX}/appointments`, appointmentsRoutes);
      expressApp.use(`${API_PREFIX}/dashboard`, dashboardRoutes);
      expressApp.use(`${API_PREFIX}/public`, publicRoutes);
      expressApp.use(`${API_PREFIX}/billing`, billingRoutes);

      // 404 handler
      expressApp.use((_req: Request, res: Response) => {
        res.status(404).json({
          success: false,
          message: 'Rota não encontrada',
        });
      });

      // Error handler
      expressApp.use(errorMiddleware);

      routesLoaded = true;
    } catch (error) {
      console.error('Error loading routes:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to initialize API',
        error: process.env.NODE_ENV !== 'production' ? String(error) : undefined,
      });
    }
  }

  return expressApp(req, res);
}
