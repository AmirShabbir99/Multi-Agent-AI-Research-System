'use strict';

const { ZodError } = require('zod');
const ApiError = require('../utils/ApiError');

/**
 * Usage: router.post('/x', validate({ body: someZodSchema }), controller)
 * Validated + coerced data replaces req.body/params/query so controllers
 * always work with clean, typed input.
 */
const validate = (schemas) => (req, res, next) => {
  try {
    if (schemas.body) req.body = schemas.body.parse(req.body);
    if (schemas.params) req.params = schemas.params.parse(req.params);
    if (schemas.query) req.query = schemas.query.parse(req.query);
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      const details = err.errors.map((e) => ({ field: e.path.join('.'), message: e.message }));
      return next(ApiError.badRequest('Validation failed.', details));
    }
    next(err);
  }
};

module.exports = validate;
