import type { VercelRequest, VercelResponse } from '@vercel/node';
import express, { Request, Response } from 'express';
import compression from 'compression';

// Criar app uma única vez (reutilizado em warm starts)
let app: express.Application | null = null;
let routesLoaded = false;

function setCorsHeaders(req: VercelRequest, res: VercelResponse): void {
  const origin = req.headers.origin;

  const allowedOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  // Se não tiver env configurado, permitir origens comuns de dev/prod
  const fallbackOrigins = [
    'http://localhost:3000',
    'https://operly-client.vercel.app',
    'https://operlyapp.com',
  ];

  const allowList = allowedOrigins.length ? allowedOrigins : fallbackOrigins;

  // Se a origem estiver na allowlist, ecoa a origem (compatível com credentials caso use no futuro)
  if (typeof origin === 'string' && allowList.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  } else {
    // Para chamadas sem Origin (ex: curl/server-to-server) ou origem não permitida
    // não setamos um origin específico.
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');
}

function getApp(): express.Application {
  if (app) return app;

  app = express();

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
  // CORS precisa ser aplicado ANTES de qualquer outra coisa, inclusive erros
  setCorsHeaders(req, res);

  // Preflight nunca deve depender de inicialização de rotas/DB
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

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
      res.status(500).json({
        success: false,
        message: 'Failed to initialize API',
        error: process.env.NODE_ENV !== 'production' ? String(error) : undefined,
      });
      return;
    }
  }

  // Express irá responder; se cair em 404/500 internos, ainda terá CORS porque setamos acima
  expressApp(req, res);
}
