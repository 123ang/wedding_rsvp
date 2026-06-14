function clientIp(req) {
  if (String(process.env.TRUST_PROXY_HEADERS || '').toLowerCase() === 'true') {
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      return String(forwardedFor).split(',')[0].trim();
    }
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function createRateLimiter({ windowMs, max, keyPrefix, message }) {
  const attempts = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const key = `${keyPrefix}:${clientIp(req)}`;
    const bucket = attempts.get(key) || { count: 0, resetAt: now + windowMs };

    if (bucket.resetAt <= now) {
      bucket.count = 0;
      bucket.resetAt = now + windowMs;
    }

    bucket.count += 1;
    attempts.set(key, bucket);

    if (bucket.count > max) {
      const retryAfterSeconds = Math.ceil((bucket.resetAt - now) / 1000);
      res.set('Retry-After', String(retryAfterSeconds));
      return res.status(429).json({
        success: false,
        message: message || 'Too many requests. Please try again later.',
      });
    }

    return next();
  };
}

module.exports = {
  createRateLimiter,
};
