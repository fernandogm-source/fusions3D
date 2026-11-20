function notFoundHandler(req, _res, next) {
  const error = new Error(`Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  error.code = 'ROUTE_NOT_FOUND';
  next(error);
}

function errorHandler(error, _req, res, _next) {
  if (error.name === 'ZodError') {
    const details = error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message
    }));

    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Error de validación en los datos enviados',
        details
      }
    });
  }

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_JSON', message: 'El cuerpo de la petición no es JSON válido' }
    });
  }

  const statusCode = error.statusCode || 500;
  const code = typeof error.code === 'string' ? error.code : 'INTERNAL_ERROR';
  const message = statusCode >= 500 ? 'Error interno del servicio IA' : error.message;

  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json({
    success: false,
    error: { code, message }
  });
}

module.exports = { notFoundHandler, errorHandler };
