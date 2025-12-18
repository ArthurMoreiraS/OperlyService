import type { VercelRequest, VercelResponse } from '@vercel/node';

function setCors(req: VercelRequest, res: VercelResponse): void {
  const origin = req.headers.origin;
  const allowedOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  if (typeof origin === 'string' && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  setCors(req, res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  res.status(200).json({
    ok: true,
    service: 'operly-service',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
}
