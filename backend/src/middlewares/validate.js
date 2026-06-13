const { z } = require('zod');

function validate(schema) {
  return function validateMiddleware(req, res, next) {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errorList = result.error.errors.map(function (err) {
        return {
          field: err.path.join('.'),
          message: err.message
        };
      });
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu gửi lên không hợp lệ',
        errors: errorList
      });
    }
    req.body = result.data;
    next();
  };
}

module.exports = validate;

