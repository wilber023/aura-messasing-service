/**
 * Middlewares Index
 */

const { authMiddleware, optionalAuth } = require('./authMiddleware');
const { AppError, errorHandler, notFoundHandler } = require('./errorMiddleware');

module.exports = {
  authMiddleware,
  optionalAuth,
  AppError,
  errorHandler,
  notFoundHandler
};