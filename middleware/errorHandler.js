const AppError = require('../utils/AppError');

// Converts common Mongoose errors into friendly AppErrors
function normalizeError(err) {
  if (err.name === 'CastError') {
    return new AppError(`Invalid ${err.path}: ${err.value}`, 400);
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return new AppError(`That ${field} is already in use.`, 400);
  }
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return new AppError(messages.join('. '), 400);
  }
  return err;
}

module.exports = (err, req, res, next) => {
  let error = normalizeError(err);
  const statusCode = error.statusCode || 500;
  const message = error.isOperational ? error.message : 'Something went wrong. Please try again.';

  if (statusCode >= 500) {
    console.error('[ERROR]', err);
  }

  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    return res.status(statusCode).json({ success: false, message });
  }

  if (req.flash) {
    req.flash('error', message);
    return res.redirect('back');
  }

  res.status(statusCode).render('errors/error', {
    title: 'Error',
    statusCode,
    message,
    layout: false,
  });
};
