const { ZodError } = require('zod');

function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const data = schema.parse(req[source]);
      req[source] = data;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message
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
      next(error);
    }
  };
}

module.exports = { validate };
