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

