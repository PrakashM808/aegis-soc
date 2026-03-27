/**
 * Global Error Handler Middleware
 */

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  // Wrong JWT error
  if (err.name === 'JsonWebTokenError') {
    const message = 'Json Web Token is invalid, Try again!';
    err = new AppError(message, 400);
  }

  // JWT Expired error
  if (err.name === 'TokenExpiredError') {
    const message = 'Json Web Token is expired, Try again!';
    err = new AppError(message, 400);
  }

  // Sequelize Validation Error
  if (err.name === 'SequelizeValidationError') {
    const message = err.errors.map(e => e.message).join(', ');
    err = new AppError(message, 400);
  }

  // Sequelize Unique Constraint Error
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = Object.keys(err.fields)[0];
    const message = `${field} already exists`;
    err = new AppError(message, 409);
  }

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = { errorHandler, AppError };
