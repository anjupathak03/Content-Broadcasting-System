const rateLimit = require('express-rate-limit');
const config = require('../config/env');

const publicLiveLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: config.publicRateLimitPerMinute,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
});

module.exports = {
  publicLiveLimiter,
};
