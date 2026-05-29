const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  const response = { error: message };
  if (process.env.NODE_ENV === 'development') response.stack = err.stack;
  res.status(status).json(response);
};

module.exports = errorHandler;
