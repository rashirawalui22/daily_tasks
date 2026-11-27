const { randomUUID } = require('crypto');

function requestId(req, res, next) {
  req.requestId = randomUUID();
  res.setHeader('X-Request-ID', req.requestId);

  const startedAt = Date.now();
  res.on('finish', () => {
    console.info(JSON.stringify({
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Date.now() - startedAt
    }));
  });

  next();
}

module.exports = requestId;
