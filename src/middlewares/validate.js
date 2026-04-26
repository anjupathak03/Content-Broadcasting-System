const { badRequest } = require('../utils/errors');

function validateBody(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(badRequest('Validation failed', result.error.flatten()));
      return;
    }
    req.body = result.data;
    next();
  };
}

function validateQuery(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      next(badRequest('Validation failed', result.error.flatten()));
      return;
    }
    req.query = result.data;
    next();
  };
}

module.exports = {
  validateBody,
  validateQuery,
};
