class AppError extends Error {
  constructor(message, statusCode = 500, details = undefined) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

const badRequest = (message, details) => new AppError(message, 400, details);
const unauthorized = (message = 'Authentication required') => new AppError(message, 401);
const forbidden = (message = 'Access denied') => new AppError(message, 403);
const notFound = (message = 'Resource not found') => new AppError(message, 404);
const conflict = (message = 'Resource already exists') => new AppError(message, 409);

module.exports = {
  AppError,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
};
