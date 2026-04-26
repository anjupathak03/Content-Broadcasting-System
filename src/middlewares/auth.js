const jwt = require('jsonwebtoken');
const config = require('../config/env');
const userModel = require('../models/userModel');
const { unauthorized, forbidden } = require('../utils/errors');

async function authenticate(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw unauthorized();
    }

    const payload = jwt.verify(token, config.jwtSecret);
    const user = await userModel.findById(payload.sub);

    if (!user) {
      throw unauthorized('Invalid token user');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      next(unauthorized('Invalid or expired token'));
      return;
    }
    next(error);
  }
}

function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user) {
      next(unauthorized());
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(forbidden());
      return;
    }

    next();
  };
}

module.exports = {
  authenticate,
  authorize,
};
