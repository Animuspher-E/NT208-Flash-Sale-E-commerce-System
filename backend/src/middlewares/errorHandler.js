// ================================================
// File: src/middlewares/errorHandler.js
// Mục đích: Bắt và xử lý MỌI lỗi trong app
//   Đây là middleware đặc biệt - nhận 4 tham số (err, req, res, next)
//   Express tự nhận ra đây là Error Handler
//
// QUAN TRỌNG: Chứa logic ROLLBACK
//   Khi ghi vào Database thất bại (bước order.service),
//   cần HOÀN TRẢ lại tồn kho trên Redis (INCR +1)
//   và xóa userId khỏi danh sách đã mua
//
// Cách hoạt động:
//   1. Bất kỳ controller/service nào throw Error -> Express tự gọi middleware này
//   2. Kiểm tra loại lỗi
//   3. Nếu là lỗi FLASH_SALE_ROLLBACK -> hoàn trả Redis
//   4. Trả về response lỗi chuẩn
//
// Ví dụ:
//   Controller gọi: next(error) hoặc throw error (trong async function)
//   ErrorHandler nhận và xử lý ngay, không để lỗi lọt ra ngoài
// ================================================

const flashsaleService = require('../services/flashsale.service');

async function rollbackRedis(productId, userId, quantity = 1) {
  try {
    console.log(`[Rollback] Hoàn trả ${quantity} sp cho product=${productId}, user=${userId}`);
    await flashsaleService.rollbackStock(productId, userId, quantity);
  } catch (rollbackError) {
    console.error(`[Rollback] CRITICAL: Rollback thất bại! productId=${productId}, userId=${userId}`);
    console.error('[Rollback] Chi tiết lỗi:', rollbackError.message);
  }
}

async function errorHandler(err, req, res, next) {
  console.error(`[ErrorHandler] Lỗi tại ${req.method} ${req.path}:`, err.message);
  if (err.needRollback && err.rollbackInfo) {
    const { productId, userId, quantity } = err.rollbackInfo;
    await rollbackRedis(productId, userId, quantity);
  }
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Lỗi máy chủ nội bộ. Vui lòng thử lại sau.';
  return res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

/**
 * catchAsync - Wrapper cho async route handler
 * Tự động bắt lỗi và forward tới Express errorHandler
 * Thay vì phải viết try/catch trong mỗi controller
 */
function catchAsync(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = errorHandler;
module.exports.catchAsync = catchAsync;
