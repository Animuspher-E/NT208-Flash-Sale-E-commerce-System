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

