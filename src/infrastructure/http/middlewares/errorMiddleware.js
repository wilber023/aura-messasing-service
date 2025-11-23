/**
 * Error Handler Middleware
 */

class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
  }
}

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code
    });
  }

  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      code: 'VALIDATION_ERROR'
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      message: 'El registro ya existe',
      code: 'DUPLICATE_ENTRY'
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    code: 'INTERNAL_ERROR'
  });
};

const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
    code: 'NOT_FOUND'
  });
};

module.exports = { AppError, errorHandler, notFoundHandler };