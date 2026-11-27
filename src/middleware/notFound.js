function notFound(req, res) {
  return res.status(404).json({
    success: false,
    message: 'Route not found',
    error: {
      code: 'ROUTE_NOT_FOUND',
      details: `No route exists for ${req.method} ${req.originalUrl}`
    }
  });
}

module.exports = notFound;
