// ================================================
// File: src/middlewares/rateLimit.js
// Mục đích: Giới hạn số lần click của mỗi user (Rate Limit)
//   Dùng Redis để đếm số request trong 1 giây
//   Nếu user gửi quá nhiều (bot/spam) -> từ chối ngay
//
// Cách hoạt động:
//   1. User gửi request -> middleware đọc userId từ req.user
//   2. Tạo key Redis: ratelimit:<userId>
//   3. Tăng bộ đếm, đặt thời hạn 1 giây (TTL = 1)
//   4. Nếu bộ đếm > giới hạn cho phép -> trả 429 Too Many Requests
//   5. Nếu OK -> cho đi tiếp
//
// Ví dụ:
//   User có userId=5 click 3 lần trong 1 giây (giới hạn=1)
//   - Lần 1: counter=1 -> OK
//   - Lần 2: counter=2 -> Từ chối! (429)
//   - Lần 3: counter=3 -> Từ chối! (429)
//   Sau 1 giây: key tự xóa, user được click lại bình thường
// ================================================

const { getRedisClient } = require('../config/redis');

function createRateLimit(options = {}) {
  const maxRequests = options.maxRequests || 1; // Tối đa 1 lần/giây
  const windowSeconds = options.windowSeconds || 1; // Cửa sổ thời gian 1 giây
  return async function rateLimitMiddleware(req, res, next) {
    const redis = getRedisClient();
    const userId = req.user.userId; 
    const key = `ratelimit:${userId}:${req.body.productId || 'general'}`;
    try {
      const currentCount = await redis.incr(key);
      if (currentCount === 1) {
        await redis.expire(key, windowSeconds);
      }
      if (currentCount > maxRequests) {
        return res.status(429).json({
          success: false,
          message: `Vui lòng thử lại sau ${windowSeconds} giây. (Giới hạn: ${maxRequests} lần/${windowSeconds}s)`
        });
      }
      next();
    } catch (error) {
      console.error('[RateLimit] Lỗi Redis:', error.message);
      next();
    }
  };
}

const flashSaleRateLimit = createRateLimit({ maxRequests: 1, windowSeconds: 1 }); // Chỉ cho mỗi user click 1 lần mỗi giây

module.exports = { createRateLimit, flashSaleRateLimit };
