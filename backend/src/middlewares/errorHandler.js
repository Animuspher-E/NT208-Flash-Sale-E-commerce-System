// ================================================
// File: src/middlewares/errorHandler.js
// Mục đích: Bắt và xử lý MỌI lỗi trong app
//   Đây là middleware đặc biệt - nhận 4 tham số (err, req, res, next)
//   Express tự nhận ra đây là Error Handler
//
// QUAN TRỌNG: Chứa logic ROLLBACK
//   Khi ghi vào MySQL thất bại (bước order.service),
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

const { getRedisClient } = require('../config/redis');
const REDIS_KEY_STOCK = (productId) => `flashsale:product_${productId}:stock`;
const REDIS_KEY_USERS = (productId) => `flashsale:product_${productId}:users`;

async function rollbackRedis(productId, userId) {
  const redis = getRedisClient();
  try {
    console.log(`[Rollback] Bắt đầu hoàn trả kho cho product=${productId}, user=${userId}`);
    // Bước 1: Cộng lại 1 vào tồn kho Redis (INCR)
    const newStock = await redis.incr(REDIS_KEY_STOCK(productId));
    console.log(`[Rollback] Đã cộng lại kho. Tồn kho mới: ${newStock}`);
    // Bước 2: Xóa userId khỏi tập hợp đã mua (SREM = Set Remove)
    await redis.srem(REDIS_KEY_USERS(productId), userId);
    console.log(`[Rollback] Đã xóa userId=${userId} khỏi danh sách đã mua`);
  } catch (rollbackError) {
    console.error(`[Rollback] CRITICAL: Rollback thất bại! productId=${productId}, userId=${userId}`);
    console.error('[Rollback] Chi tiết lỗi:', rollbackError.message);
  }
}

async function errorHandler(err, req, res, next) {
  console.error(`[ErrorHandler] Lỗi tại ${req.method} ${req.path}:`, err.message);
  if (err.needRollback && err.rollbackInfo) {
    const { productId, userId } = err.rollbackInfo;
    await rollbackRedis(productId, userId);
  }
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Lỗi máy chủ nội bộ. Vui lòng thử lại sau.';
  return res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

module.exports = errorHandler;
