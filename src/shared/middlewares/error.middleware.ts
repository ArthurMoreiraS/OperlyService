import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ApiError } from '../utils';
import { config } from '../../config';

export function errorMiddleware(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log do erro (em produção, usar um logger adequado)
  if (config.isDevelopment) {
    console.error('Error:', error);
  } else {
    console.error('Error:', error.message);
  }

  // Erro operacional conhecido
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      errors: error.errors,
    });
    return;
  }

  // Erros do Prisma
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    handlePrismaError(error, res);
    return;
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      success: false,
      message: 'Dados inválidos enviados ao banco de dados',
    });
    return;
  }

  // Erro de sintaxe JSON
  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({
      success: false,
      message: 'JSON inválido no corpo da requisição',
    });
    return;
  }

  // Erro genérico (não expor detalhes em produção)
  res.status(500).json({
    success: false,
    message: config.isDevelopment ? error.message : 'Erro interno do servidor',
  });
}

function handlePrismaError(
  error: Prisma.PrismaClientKnownRequestError,
  res: Response
): void {
  switch (error.code) {
    case 'P2002': {
      // Unique constraint violation
      const target = (error.meta?.target as string[]) || [];
      const field = target[0] || 'campo';
      res.status(409).json({
        success: false,
        message: `Já existe um registro com este ${field}`,
        errors: [{ field, message: 'Valor já em uso' }],
      });
      return;
    }

    case 'P2003': {
      // Foreign key constraint violation
      res.status(400).json({
        success: false,
        message: 'Referência inválida para outro registro',
      });
      return;
    }

    case 'P2025': {
      // Record not found
      res.status(404).json({
        success: false,
        message: 'Registro não encontrado',
      });
      return;
    }

    default:
      res.status(400).json({
        success: false,
        message: 'Erro ao processar dados',
      });
  }
}
