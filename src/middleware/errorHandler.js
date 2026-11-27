function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const requestId = req.requestId || null;

  if (error.name === 'QuizAttemptValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.errors,
      requestId
    });
  }

  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON body',
      errors: [{
        field: 'body',
        message: 'Request body must contain valid JSON'
      }],
      requestId
    });
  }

  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'A record with this unique value already exists',
      error: {
        code: 'DUPLICATE_VALUE',
        details: 'The record conflicts with an existing unique value'
      },
      requestId
    });
  }

  if (error.status && error.code) {
    return res.status(error.status).json({
      success: false,
      message: error.message,
      error: {
        code: error.code,
        details: error.message
      },
      requestId
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
      },
      requestId
    });
  }

  console.error(`[${requestId}] Unexpected server error: ${error.message}`);
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      details: 'An unexpected error occurred'
    },
    requestId
  });
}

module.exports = errorHandler;
