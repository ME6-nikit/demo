function errorHandler(error, _req, res, _next) {
  const statusCode = error.statusCode || 500;
  const response = {
    error: error.message || "Internal Server Error",
  };

  if (process.env.NODE_ENV !== "production" && error.details) {
    response.details = error.details;
  }

  res.status(statusCode).json(response);
}

module.exports = errorHandler;
