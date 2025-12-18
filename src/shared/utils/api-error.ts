export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors?: { field: string; message: string }[];

  constructor(
    message: string,
    statusCode = 400,
    isOperational = true,
    errors?: { field: string; message: string }[]
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static badRequest(message: string, errors?: { field: string; message: string }[]) {
    return new ApiError(message, 400, true, errors);
  }

  static unauthorized(message = 'Não autorizado') {
    return new ApiError(message, 401);
  }

  static forbidden(message = 'Acesso negado') {
    return new ApiError(message, 403);
  }

  static notFound(message = 'Recurso não encontrado') {
    return new ApiError(message, 404);
  }

  static conflict(message: string) {
    return new ApiError(message, 409);
  }

  static validationError(errors: { field: string; message: string }[]) {
    return new ApiError('Dados inválidos', 422, true, errors);
  }

  static internal(message = 'Erro interno do servidor') {
    return new ApiError(message, 500, false);
  }
}
