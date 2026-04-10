// ================================================
// File: src/middlewares/auth.js
// Mục đích: Xác thực JWT Token
//   Mỗi request đến API cần xác thực phải có Token
//   Middleware này đọc Token, kiểm tra hợp lệ, rồi
//   lưu thông tin user vào req.user để các bước sau dùng
//
// Cách hoạt động:
//   1. Client gửi request kèm header: Authorization: Bearer <token>
//   2. Middleware đọc token từ header
//   3. Dùng jsonwebtoken.verify() kiểm tra chữ ký và hạn dùng
//   4. Nếu hợp lệ: lưu { userId, email, role } vào req.user
//   5. Nếu không hợp lệ: trả về lỗi 401
//
// Ví dụ:
//   Input:  Header: Authorization: Bearer eyJhbGci...
//   Output: req.user = { userId: 5, email: 'user@email.com', role: 'user' }
// ================================================

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_change_in_production';

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Thiếu Authorization header. Vui lòng đăng nhập.'
    });
  }
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      success: false,
      message: 'Định dạng Token sai. Phải là: Bearer <token>'
    });
  }
  const token = parts[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token đã hết hạn. Vui lòng đăng nhập lại.'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ.'
    });
  }
}

module.exports = authMiddleware;
