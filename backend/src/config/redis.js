// ================================================
// File: src/config/redis.js
// Mục đích: Khởi tạo kết nối Redis
//   Redis là bộ nhớ đệm (Cache) siêu nhanh
//   Lưu dữ liệu trên RAM thay vì ổ cứng
//   Dùng để: lưu tồn kho, đếm rate limit, warm-up cache
//
// Ví dụ:
//   - Ghi: redis.set('product:1:stock', 100)
//   - Đọc: redis.get('product:1:stock') => '100'
//   - Giảm 1: redis.decr('product:1:stock') => 99
// ================================================

const Redis = require('ioredis');
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
let redisClient = null;

function connectRedis() {
  redisClient = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
    retryStrategy: function (times) {
      const delay = Math.min(times * 100, 2000);
      console.log(`[Redis] Đang thử kết nối lại lần ${times}, chờ ${delay}ms...`);
      return delay;
    }
  });
  redisClient.on('connect', () => {
    console.log('[Redis] Kết nối Redis thành công!');
  });
  redisClient.on('error', (err) => {
    console.error('[Redis] Lỗi kết nối Redis:', err.message);
  });
  redisClient.on('close', () => {
    console.log('[Redis] Kết nối Redis đã đóng');
  });
  return redisClient;
}

function getRedisClient() {
  if (!redisClient) {
    redisClient = connectRedis();
  }
  return redisClient;
}

module.exports = { connectRedis, getRedisClient };
