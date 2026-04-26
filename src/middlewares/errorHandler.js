const multer = require('multer');
const config = require('../config/env');
const { AppError } = require('../utils/errors');

function notFoundHandler(req, _res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

function errorHandler(error, _req, res, _next) {
  if (error instanceof multer.MulterError) {
    const message = error.code === 'LIMIT_FILE_SIZE'
      ? `File size must be ${config.maxFileSizeMb}MB or less`
      : error.message;

    res.status(400).json({
      success: false,
      message,
    });
    return;
  }

  const statusCode = error.statusCode || 500;
  const response = {
    success: false,
    message: statusCode === 500 ? 'Internal server error' : error.message,
  };

  if (error.details) {
    response.details = error.details;
  }

  if (config.nodeEnv === 'development') {
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
