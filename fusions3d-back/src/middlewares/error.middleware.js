function notFoundHandler(req, _res, next) {
  const error = new Error(`Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  error.code = 'ROUTE_NOT_FOUND';
  next(error);
}

function errorHandler(error, _req, res, _next) {
  console.error(error);

  let statusCode = error.statusCode || 500;
  let code = error.code || 'INTERNAL_ERROR';
  let message = error.message || 'Error interno del servidor';
  let details = undefined;

  if (error.name === 'ZodError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Error de validación en los datos enviados';
    details = error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message
    }));
  }

  if (error.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = Object.values(error.errors).map((item) => item.message).join(', ');
  }

  if (error.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_ID';
    message = `ID inválido: ${error.value}`;
  }

  if (error.code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_KEY';
    message = 'Ya existe un registro con el mismo identificador único';
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
      ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {})
    }
  });
}

module.exports = { notFoundHandler, errorHandler };
