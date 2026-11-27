function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON body',
      error: {
        code: 'INVALID_JSON',
        details: 'Request body must contain valid JSON'
      }
    });
  }

  if (error.name === 'ValidationError' || error.name === 'CastError') {
    const details = error.name === 'ValidationError'
      ? Object.values(error.errors).map((item) => item.message)
      : error.message;

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: {
        code: 'VALIDATION_ERROR',
        details
      }
    });
  }

  console.error(error);
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      details: 'An unexpected error occurred'
    }
  });
}

module.exports = errorHandler;
