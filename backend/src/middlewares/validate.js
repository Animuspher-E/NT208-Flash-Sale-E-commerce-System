// ================================================
// File: src/middlewares/validate.js
// Mục đích: Kiểm tra dữ liệu đầu vào (Validate)
//   Dùng thư viện Zod để định nghĩa "khuôn" dữ liệu
//   Nếu dữ liệu sai khuôn -> chặn ngay, không xử lý tiếp
//
// Cách hoạt động:
//   1. Nhận vào một Zod Schema (bộ luật kiểm tra)
//   2. Trả về middleware function
//   3. Middleware dùng schema.parse(req.body) để kiểm tra
//   4. Nếu sai -> trả về lỗi 400 với danh sách trường bị sai
//   5. Nếu đúng -> cho đi tiếp
//
// Ví dụ:
//   Input đúng:  { "email": "a@b.com", "password": "123456" }
//   Input sai:   { "email": "not_an_email", "password": "123" }
//   Output lỗi: { success: false, errors: [{ field: 'email', message: 'Email không đúng định dạng' }] }
// ================================================

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
