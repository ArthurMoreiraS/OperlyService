import { createApp } from '../src/app';
import { VercelRequest, VercelResponse } from '@vercel/node';

const app = createApp();

// Vercel Serverless Function Handler
export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req, res);
}
