const ApiError = require('../utils/ApiError');

function notFound(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let status = err.statusCode || 500;
  let message = err.message || 'Something went wrong';
  let errors = err.errors;

  if (err.name === 'ValidationError') {
    status = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Invalid value for ${err.path}`;
    errors = undefined;
  } else if (err.code === 11000) {
    status = 409;
    const fields = Object.keys(err.keyValue || {}).join(', ');
    message = `A record with the same ${fields} already exists`;
    errors = undefined;
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Invalid JSON in request body';
  }

  if (status === 500) {
    console.error(err);
    message = 'Internal server error';
  }

  res.status(status).json({ message, ...(errors && { errors }) });
}

module.exports = { notFound, errorHandler };
